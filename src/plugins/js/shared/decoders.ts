import type { ESTree } from '@oxlint/plugins';

import { forEachChild } from '../../../lib/ast-node.ts';

type VisitorKeys = Readonly<Record<string, readonly string[]>>;
type RuntimeFunction = ESTree.ArrowFunctionExpression | ESTree.Function;

/** Return types that do not carry a decoded value. */
const checkOnlyReturnKinds: ReadonlySet<string> = new Set([
  'TSAnyKeyword',
  'TSBooleanKeyword',
  'TSNeverKeyword',
  'TSTypePredicate',
  'TSUndefinedKeyword',
  'TSUnknownKeyword',
  'TSVoidKeyword',
]);

function unwrapType(type: ESTree.TSType): ESTree.TSType {
  let current = type;
  while (current.type === 'TSParenthesizedType') current = current.typeAnnotation;
  return current;
}

function isConstAssertion(node: ESTree.TSAsExpression | ESTree.TSTypeAssertion): boolean {
  return (
    node.typeAnnotation.type === 'TSTypeReference' &&
    node.typeAnnotation.typeName.type === 'Identifier' &&
    node.typeAnnotation.typeName.name === 'const'
  );
}

/** Syntax that lets a return value skip the proof from the checks above it. */
function isEscapeHatch(node: ESTree.Node): boolean {
  if (node.type === 'TSAnyKeyword' || node.type === 'TSNonNullExpression') return true;
  if (node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion') {
    return !isConstAssertion(node);
  }
  return false;
}

/** `Promise<T>` of an async decoder gives `T`. */
function decodedType(type: ESTree.TSType): ESTree.TSType {
  const unwrapped = unwrapType(type);
  if (
    unwrapped.type === 'TSTypeReference' &&
    unwrapped.typeName.type === 'Identifier' &&
    unwrapped.typeName.name === 'Promise'
  ) {
    const [value] = unwrapped.typeArguments?.params ?? [];
    return value === undefined ? unwrapped : unwrapType(value);
  }
  return unwrapped;
}

function isDataReturnType(type: ESTree.TSType): boolean {
  const value = decodedType(type);
  if (checkOnlyReturnKinds.has(value.type)) return false;
  if (value.type !== 'TSUnionType') return true;
  const members = value.types.map(unwrapType);
  return (
    !members.some(
      (member) => member.type === 'TSUnknownKeyword' || member.type === 'TSAnyKeyword',
    ) &&
    members.some(
      (member) =>
        member.type !== 'TSUndefinedKeyword' &&
        member.type !== 'TSNullKeyword' &&
        member.type !== 'TSVoidKeyword',
    )
  );
}

function hasEscapeHatch(node: ESTree.Node, visitorKeys: VisitorKeys): boolean {
  if (isEscapeHatch(node)) return true;
  let found = false;
  forEachChild(node, visitorKeys[node.type] ?? [], (child) => {
    found ||= hasEscapeHatch(child, visitorKeys);
  });
  return found;
}

function isSingleUnknownInput(fn: RuntimeFunction): boolean {
  if (fn.params.length !== 1) return false;
  const [parameter] = fn.params;
  return (
    parameter?.type === 'Identifier' &&
    parameter.typeAnnotation?.typeAnnotation.type === 'TSUnknownKeyword'
  );
}

const decoderCache = new WeakMap<RuntimeFunction, boolean>();

/**
 * Reports whether a function is a small hand-written decoder, the parse
 * boundary itself. It has one `unknown` parameter, an explicit return type
 * that carries data (not `boolean`, `void`, `unknown`, `any`, or a type
 * predicate), and no `as`, `<T>`, `!`, or `any` in the body. With no escape
 * hatch, TypeScript proves that each return value came from a check on the
 * input, so every path returns a narrowed value, `undefined`/`null`, or throws.
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html
 */
export function isDecoderFunction(fn: RuntimeFunction, visitorKeys: VisitorKeys): boolean {
  const cached = decoderCache.get(fn);
  if (cached !== undefined) return cached;
  const returnType = fn.returnType?.typeAnnotation;
  const result =
    returnType !== undefined &&
    isSingleUnknownInput(fn) &&
    isDataReturnType(returnType) &&
    fn.body !== null &&
    !hasEscapeHatch(fn.body, visitorKeys);
  decoderCache.set(fn, result);
  return result;
}
