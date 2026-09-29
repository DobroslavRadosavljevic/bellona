import type { ESTree, SourceCode, Variable } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { createTypeEnvironment, type TypeEnvironment } from './dictionary-types.ts';
import { resolveVariable } from './scope.ts';

const primitiveKeywordKinds: ReadonlySet<string> = new Set([
  'TSBigIntKeyword',
  'TSBooleanKeyword',
  'TSNumberKeyword',
  'TSStringKeyword',
  'TSSymbolKeyword',
  'TSUndefinedKeyword',
]);

/** Type syntax that names a type declared somewhere this file cannot read. */
const opaqueTypeKinds: ReadonlySet<string> = new Set([
  'TSImportType',
  'TSIndexedAccessType',
  'TSTypeQuery',
]);

/**
 * How `typeof` sees a union member:
 * - `narrowable`: a primitive, literal, or function type;
 * - `other`: an object type;
 * - `top`: `unknown`, `any`, or an unconstrained type parameter;
 * - `opaque`: a named type declared outside this file (a declared contract).
 */
type MemberKind = 'narrowable' | 'opaque' | 'other' | 'top';

export interface NarrowingEnvironment {
  readonly sourceCode: SourceCode;
  readonly types: TypeEnvironment;
  /** Local names that `import` statements bind in this file. */
  readonly imported: ReadonlySet<string>;
}

export function createNarrowingEnvironment(
  sourceCode: SourceCode,
  program: ESTree.Program,
): NarrowingEnvironment {
  const imported = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    for (const specifier of statement.specifiers) imported.add(specifier.local.name);
  }
  return { sourceCode, types: createTypeEnvironment(program), imported };
}

function unwrapType(type: ESTree.TSType): ESTree.TSType {
  let current = type;
  while (current.type === 'TSParenthesizedType') current = current.typeAnnotation;
  return current;
}

/**
 * Find the type parameter `name` that is in scope at `anchor`: on the
 * enclosing function, method, class, interface, or type alias.
 */
function typeParameterInScope(name: string, anchor: ESTree.Node): ESTree.TSTypeParameter | null {
  let current: ESTree.Node | null = anchor;
  while (current !== null && current.type !== 'Program') {
    if ('typeParameters' in current) {
      const parameter = current.typeParameters?.params.find((entry) => entry.name.name === name);
      if (parameter !== undefined) return parameter;
    }
    current = current.parent;
  }
  return null;
}

function memberKind(type: ESTree.TSType): MemberKind {
  if (type.type === 'TSUnknownKeyword' || type.type === 'TSAnyKeyword') return 'top';
  if (opaqueTypeKinds.has(type.type)) return 'opaque';
  if (type.type === 'TSTypeReference' && type.typeName.type !== 'Identifier') return 'opaque';
  if (
    primitiveKeywordKinds.has(type.type) ||
    type.type === 'TSLiteralType' ||
    type.type === 'TSTemplateLiteralType' ||
    type.type === 'TSFunctionType' ||
    type.type === 'TSConstructorType'
  ) {
    return 'narrowable';
  }
  // `string & {}` keeps the string member open for autocomplete; it is still a string.
  if (type.type === 'TSIntersectionType') {
    return type.types.some((member) => primitiveKeywordKinds.has(unwrapType(member).type))
      ? 'narrowable'
      : 'other';
  }
  return 'other';
}

/** Global lib types whose values are objects, so `typeof` has nothing to narrow. */
const objectOnlyGlobals: ReadonlySet<string> = new Set([
  'Array',
  'ArrayBuffer',
  'AsyncGenerator',
  'Blob',
  'DataView',
  'Date',
  'Document',
  'Element',
  'EventTarget',
  'File',
  'FormData',
  'Generator',
  'Headers',
  'HTMLCollection',
  'Map',
  'Node',
  'NodeList',
  'Object',
  'Promise',
  'PromiseLike',
  'ReadonlyArray',
  'ReadonlyMap',
  'ReadonlySet',
  'Record',
  'RegExp',
  'Request',
  'Response',
  'Set',
  'SharedArrayBuffer',
  'Text',
  'URL',
  'URLSearchParams',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'Window',
]);

/** `*Error`, typed arrays (`Uint8Array`), DOM elements, and events. */
const objectOnlyGlobalPatterns: readonly RegExp[] = [
  /Error$/u,
  /Array$/u,
  /^(?:HTML|SVG|MathML)\w*Element$/u,
  /Event$/u,
];

/** Global generic types that keep the kinds of their first argument. */
const transparentGlobals: ReadonlySet<string> = new Set([
  'Awaited',
  'NonNullable',
  'Partial',
  'Readonly',
  'Required',
]);

/**
 * Reports whether `name` is a global lib type at `anchor`: no type parameter,
 * local declaration, or import binds it. `FormDataEntryValue`, `PropertyKey`,
 * and `RequestInit` are global types.
 */
function isGlobalTypeName(
  name: string,
  anchor: ESTree.Node,
  environment: NarrowingEnvironment,
): boolean {
  if (
    typeParameterInScope(name, anchor) !== null ||
    environment.types.aliases.has(name) ||
    environment.types.interfaces.has(name) ||
    environment.imported.has(name)
  ) {
    return false;
  }
  if (anchor.type !== 'TSTypeReference' || anchor.typeName.type !== 'Identifier') return true;
  const variable = resolveVariable(environment.sourceCode, anchor.typeName);
  return variable === null || variable.defs.length === 0;
}

function isObjectOnlyGlobal(name: string): boolean {
  return (
    objectOnlyGlobals.has(name) || objectOnlyGlobalPatterns.some((pattern) => pattern.test(name))
  );
}

/** `Partial<X>`, `Readonly<X>`, `NonNullable<X>`, `Awaited<X>`: the global wrapper's `X`. */
function transparentArgument(
  type: ESTree.TSType,
  environment: NarrowingEnvironment,
): ESTree.TSType | null {
  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') return null;
  const name = type.typeName.name;
  if (!transparentGlobals.has(name) || !isGlobalTypeName(name, type, environment)) return null;
  return type.typeArguments?.params[0] ?? null;
}

/**
 * Flatten a union into member kinds. A local type alias is expanded, so
 * `type Style = Css | (() => Css)` gives two members. A type parameter `T`
 * stands for its constraint (`T extends Probe`); with no constraint it can be
 * `unknown`. An imported name, an indexed access (`Props["style"]`), a
 * qualified name (`React.ReactNode`), and a type query are opaque.
 */
function memberKinds(
  type: ESTree.TSType,
  environment: NarrowingEnvironment,
  anchor: ESTree.Node,
  resolving: ReadonlySet<string>,
): readonly MemberKind[] {
  const unwrapped = unwrapType(type);
  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.flatMap((member) => memberKinds(member, environment, anchor, resolving));
  }
  if (
    unwrapped.type !== 'TSTypeReference' ||
    unwrapped.typeName.type !== 'Identifier' ||
    resolving.has(unwrapped.typeName.name)
  ) {
    return [memberKind(unwrapped)];
  }
  const name = unwrapped.typeName.name;
  const next = new Set(resolving);
  next.add(name);
  const parameter = typeParameterInScope(name, anchor);
  if (parameter !== null) {
    return parameter.constraint === null || parameter.constraint === undefined
      ? ['top']
      : memberKinds(parameter.constraint, environment, parameter, next);
  }
  const alias = environment.types.aliases.get(name);
  if (alias !== undefined) return memberKinds(alias.typeAnnotation, environment, alias, next);
  if (environment.imported.has(name)) return ['opaque'];
  if (!isGlobalTypeName(name, unwrapped, environment)) return [memberKind(unwrapped)];
  const argument = transparentArgument(unwrapped, environment);
  if (argument !== null) return memberKinds(argument, environment, anchor, next);
  if (name === 'Function') return ['narrowable'];
  return isObjectOnlyGlobal(name) ? ['other'] : ['opaque'];
}

function propertyKeyName(key: ESTree.PropertyKey): string | null {
  if (key.type === 'Identifier') return key.name;
  return key.type === 'Literal' && isJsString(key.value) ? key.value : null;
}

interface ObjectMembers {
  readonly members: readonly ESTree.TSSignature[];
  /** The type also takes members from a place this file cannot read. */
  readonly open: boolean;
}

const closedEmpty: ObjectMembers = { members: [], open: false };

function mergeMembers(parts: readonly ObjectMembers[]): ObjectMembers {
  return {
    members: parts.flatMap((part) => part.members),
    open: parts.some((part) => part.open),
  };
}

/** Object members that a type literal, local interface, or local alias lists. */
function objectMembers(
  type: ESTree.TSType,
  environment: NarrowingEnvironment,
  resolving: ReadonlySet<string>,
): ObjectMembers {
  const unwrapped = unwrapType(type);
  if (unwrapped.type === 'TSTypeLiteral') return { members: unwrapped.members, open: false };
  if (unwrapped.type === 'TSIntersectionType') {
    return mergeMembers(
      unwrapped.types.map((member) => objectMembers(member, environment, resolving)),
    );
  }
  if (memberKind(unwrapped) === 'opaque') return { members: [], open: true };
  if (unwrapped.type !== 'TSTypeReference' || unwrapped.typeName.type !== 'Identifier') {
    return closedEmpty;
  }
  const name = unwrapped.typeName.name;
  if (resolving.has(name)) return closedEmpty;
  const next = new Set(resolving);
  next.add(name);
  const interfaces = environment.types.interfaces.get(name);
  if (interfaces !== undefined) {
    return {
      members: interfaces.flatMap((declaration) => declaration.body.body),
      open: interfaces.some((declaration) => declaration.extends.length > 0),
    };
  }
  const alias = environment.types.aliases.get(name);
  if (alias !== undefined) return objectMembers(alias.typeAnnotation, environment, next);
  const argument = transparentArgument(unwrapped, environment);
  if (argument !== null) return objectMembers(argument, environment, next);
  // An imported or global lib type (`RequestInit`) lists members this file cannot read.
  return environment.imported.has(name) || isGlobalTypeName(name, unwrapped, environment)
    ? { members: [], open: true }
    : closedEmpty;
}

interface DeclaredType {
  readonly type: ESTree.TSType;
  /** An optional parameter (`x?: T`) also holds `undefined`. */
  readonly optional: boolean;
  /** A type (or member of a type) that this file cannot read: a declared contract. */
  readonly opaque: boolean;
}

/** The alternatives a value can have. `null` means the trace found no declared type. */
type Traced = readonly DeclaredType[] | null;

/** Stop a trace after this many steps, so the rule stays fast. */
const MAX_TRACE_DEPTH = 8;

function declared(type: ESTree.TSType): DeclaredType {
  return { type, optional: false, opaque: false };
}

function opaqueFrom(owner: DeclaredType): DeclaredType {
  return { ...owner, opaque: true };
}

function isGlobalName(
  type: ESTree.TSTypeReference,
  names: ReadonlySet<string>,
  environment: NarrowingEnvironment,
): boolean {
  if (type.typeName.type !== 'Identifier') return false;
  const { name } = type.typeName;
  return (
    names.has(name) &&
    !environment.types.aliases.has(name) &&
    !environment.types.interfaces.has(name) &&
    !environment.imported.has(name)
  );
}

const arrayNames: ReadonlySet<string> = new Set(['Array', 'ReadonlyArray']);
const recordNames: ReadonlySet<string> = new Set(['Record']);

/**
 * Split a type into the parts that a member read can see. `Props | undefined`
 * gives `Props`: TypeScript needs a check or `?.` before the read, and after
 * it only `Props` is left. Local aliases are expanded.
 */
function readableParts(
  type: ESTree.TSType,
  environment: NarrowingEnvironment,
  resolving: ReadonlySet<string>,
): readonly ESTree.TSType[] {
  let unwrapped = unwrapType(type);
  if (unwrapped.type === 'TSTypeOperator' && unwrapped.operator === 'readonly') {
    unwrapped = unwrapType(unwrapped.typeAnnotation);
  }
  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.flatMap((member) => readableParts(member, environment, resolving));
  }
  if (unwrapped.type === 'TSUndefinedKeyword' || unwrapped.type === 'TSNullKeyword') return [];
  const argument = transparentArgument(unwrapped, environment);
  if (argument !== null) return readableParts(argument, environment, resolving);
  if (unwrapped.type === 'TSTypeReference' && unwrapped.typeName.type === 'Identifier') {
    const name = unwrapped.typeName.name;
    const alias = environment.types.aliases.get(name);
    if (
      alias !== undefined &&
      !resolving.has(name) &&
      typeParameterInScope(name, unwrapped) === null
    ) {
      const next = new Set(resolving);
      next.add(name);
      return readableParts(alias.typeAnnotation, environment, next);
    }
  }
  return [unwrapped];
}

/** Map each readable part of each alternative. One unresolved part fails the whole trace. */
function mapParts(
  owners: Traced,
  environment: NarrowingEnvironment,
  read: (part: ESTree.TSType, owner: DeclaredType) => Traced,
): Traced {
  if (owners === null) return null;
  const result: DeclaredType[] = [];
  for (const owner of owners) {
    if (owner.opaque) {
      result.push(owner);
      continue;
    }
    const parts = readableParts(owner.type, environment, new Set());
    if (parts.length === 0) return null;
    for (const part of parts) {
      if (memberKind(part) === 'top') return null;
      if (memberKinds(part, environment, part, new Set()).includes('opaque')) {
        result.push(opaqueFrom(owner));
        continue;
      }
      const next = read(part, owner);
      if (next === null) return null;
      result.push(...next);
    }
  }
  return result;
}

function propertyTypes(owners: Traced, name: string, environment: NarrowingEnvironment): Traced {
  return mapParts(owners, environment, (part, owner) => {
    if (part.type === 'TSTypeReference' && isGlobalName(part, recordNames, environment)) {
      const value = part.typeArguments?.params[1];
      return value === undefined ? null : [declared(value)];
    }
    const { members, open } = objectMembers(part, environment, new Set());
    for (const member of members) {
      if (
        member.type === 'TSPropertySignature' &&
        !member.computed &&
        propertyKeyName(member.key) === name &&
        member.typeAnnotation !== null &&
        member.typeAnnotation !== undefined
      ) {
        return [
          { type: member.typeAnnotation.typeAnnotation, optional: member.optional, opaque: false },
        ];
      }
    }
    return open ? [opaqueFrom(owner)] : null;
  });
}

function arrayElement(
  part: ESTree.TSType,
  environment: NarrowingEnvironment,
): ESTree.TSType | null {
  if (part.type === 'TSArrayType') return part.elementType;
  if (part.type === 'TSTypeReference' && isGlobalName(part, arrayNames, environment)) {
    return part.typeArguments?.params[0] ?? null;
  }
  return null;
}

/** `for (const item of data)`: the element type of an array. */
function elementTypes(owners: Traced, environment: NarrowingEnvironment): Traced {
  return mapParts(owners, environment, (part) => {
    const element = arrayElement(part, environment);
    return element === null ? null : [declared(element)];
  });
}

/** `row[key]` with a runtime key: an array element, a `Record` value, or an index signature. */
function indexedTypes(owners: Traced, environment: NarrowingEnvironment): Traced {
  return mapParts(owners, environment, (part) => {
    const element = arrayElement(part, environment);
    if (element !== null) return [declared(element)];
    if (part.type === 'TSTypeReference' && isGlobalName(part, recordNames, environment)) {
      const value = part.typeArguments?.params[1];
      return value === undefined ? null : [declared(value)];
    }
    const { members, open } = objectMembers(part, environment, new Set());
    for (const member of members) {
      if (member.type === 'TSIndexSignature' && member.typeAnnotation !== null) {
        return [declared(member.typeAnnotation.typeAnnotation)];
      }
    }
    return open ? [declared(part)].map(opaqueFrom) : null;
  });
}

/** `x?: T` on a parameter. The AST type of a plain identifier does not list the mark. */
function isOptionalMark(node: { readonly optional?: boolean | null }): boolean {
  return node.optional === true;
}

function ownAnnotation(node: ESTree.Node): ESTree.TSTypeAnnotation | null {
  if (node.type !== 'Identifier' && node.type !== 'ObjectPattern' && node.type !== 'ArrayPattern') {
    return null;
  }
  const parent = node.parent;
  return (
    node.typeAnnotation ??
    (parent?.type === 'AssignmentPattern' && parent.left === node ? parent.typeAnnotation : null) ??
    null
  );
}

/**
 * The type of a binding: its annotation, or, with no annotation, the type of
 * its source. A default (`{ grid = false }`) does not change the type.
 */
function bindingTypes(node: ESTree.Node, environment: NarrowingEnvironment, depth: number): Traced {
  if (depth > MAX_TRACE_DEPTH) return null;
  const annotation = ownAnnotation(node);
  const parent = node.parent;
  if (annotation !== null) {
    const optional =
      node.type === 'Identifier' && isOptionalMark(node) && parent?.type !== 'AssignmentPattern';
    return [{ type: annotation.typeAnnotation, optional, opaque: false }];
  }
  if (parent === null) return null;
  if (parent.type === 'AssignmentPattern' && parent.left === node) {
    return bindingTypes(parent, environment, depth + 1);
  }
  if (
    parent.type === 'Property' &&
    parent.value === node &&
    parent.parent?.type === 'ObjectPattern'
  ) {
    const name = parent.computed ? null : propertyKeyName(parent.key);
    return name === null
      ? null
      : propertyTypes(bindingTypes(parent.parent, environment, depth + 1), name, environment);
  }
  if (parent.type === 'ArrayPattern') {
    return elementTypes(bindingTypes(parent, environment, depth + 1), environment);
  }
  if (parent.type !== 'VariableDeclarator' || parent.id !== node) return null;
  const declaration = parent.parent;
  const loop = declaration?.parent;
  if (loop?.type === 'ForOfStatement' && loop.left === declaration) {
    return elementTypes(expressionTypes(loop.right, environment, depth + 1), environment);
  }
  return parent.init === null ? null : expressionTypes(parent.init, environment, depth + 1);
}

function isReassigned(variable: Variable): boolean {
  return variable.references.some((reference) => reference.isWrite() && !reference.init);
}

function isConstAssertion(node: ESTree.TSAsExpression | ESTree.TSTypeAssertion): boolean {
  return (
    node.typeAnnotation.type === 'TSTypeReference' &&
    node.typeAnnotation.typeName.type === 'Identifier' &&
    node.typeAnnotation.typeName.name === 'const'
  );
}

/**
 * Trace an expression to the declared types it can have: an annotated binding,
 * a `const` set from one, a member or indexed read, a `for…of` element, a
 * conditional whose branches all trace, or an `as T` assertion.
 */
function expressionTypes(
  expression: ESTree.Expression,
  environment: NarrowingEnvironment,
  depth: number,
): Traced {
  if (depth > MAX_TRACE_DEPTH) return null;
  const next = depth + 1;
  switch (expression.type) {
    case 'ParenthesizedExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
    case 'ChainExpression':
      return expressionTypes(expression.expression, environment, next);
    case 'TSAsExpression':
    case 'TSTypeAssertion':
      return isConstAssertion(expression)
        ? expressionTypes(expression.expression, environment, next)
        : [declared(expression.typeAnnotation)];
    case 'ConditionalExpression': {
      const consequent = expressionTypes(expression.consequent, environment, next);
      const alternate = expressionTypes(expression.alternate, environment, next);
      return consequent === null || alternate === null ? null : [...consequent, ...alternate];
    }
    case 'Identifier': {
      const variable = resolveVariable(environment.sourceCode, expression);
      const [identifier] = variable?.identifiers ?? [];
      if (variable === null || identifier === undefined || isReassigned(variable)) return null;
      return bindingTypes(identifier, environment, next);
    }
    case 'MemberExpression': {
      const owners = expressionTypes(expression.object, environment, next);
      const { property } = expression;
      if (!expression.computed && property.type === 'Identifier') {
        return propertyTypes(owners, property.name, environment);
      }
      if (property.type === 'Literal' && isJsString(property.value)) {
        return propertyTypes(owners, property.value, environment);
      }
      return indexedTypes(owners, environment);
    }
    default:
      return null;
  }
}

/**
 * Reports whether `typeof expression` narrows a declared type. The trace
 * follows `const` bindings, member and indexed reads, `for…of` elements,
 * conditionals, and `as T` back to an annotation in this file. The result must
 * not hold `unknown` or `any`. Then it passes when it holds an opaque named
 * type (the contract is declared elsewhere, and other rules check it there),
 * or a primitive, literal, or function member and one more member.
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards
 */
export function isDeclaredNarrowableUnion(
  expression: ESTree.Expression,
  environment: NarrowingEnvironment,
): boolean {
  const traced = expressionTypes(expression, environment, 0);
  if (traced === null) return false;
  const kinds: MemberKind[] = [];
  for (const entry of traced) {
    if (entry.opaque) {
      kinds.push('opaque');
      continue;
    }
    kinds.push(...memberKinds(entry.type, environment, entry.type, new Set()));
    if (entry.optional) kinds.push('narrowable');
  }
  if (kinds.includes('top')) return false;
  if (kinds.includes('opaque')) return true;
  return kinds.length > 1 && kinds.includes('narrowable');
}
