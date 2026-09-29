import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  classifyUnsafeDictionary,
  classifyUnsafeDictionaryValue,
  createTypeEnvironment,
  type TypeEnvironment,
} from '../shared/dictionary-types.ts';
import { parameterOwner } from '../shared/parameters.ts';

const typeNodeKinds: ReadonlySet<string> = new Set([
  'JSDocNonNullableType',
  'JSDocNullableType',
  'JSDocUnknownType',
  'TSAnyKeyword',
  'TSArrayType',
  'TSBigIntKeyword',
  'TSBooleanKeyword',
  'TSConditionalType',
  'TSConstructorType',
  'TSFunctionType',
  'TSImportType',
  'TSIndexedAccessType',
  'TSInferType',
  'TSIntersectionType',
  'TSIntrinsicKeyword',
  'TSLiteralType',
  'TSMappedType',
  'TSNamedTupleMember',
  'TSNeverKeyword',
  'TSNullKeyword',
  'TSNumberKeyword',
  'TSObjectKeyword',
  'TSParenthesizedType',
  'TSStringKeyword',
  'TSSymbolKeyword',
  'TSTemplateLiteralType',
  'TSThisType',
  'TSTupleType',
  'TSTypeLiteral',
  'TSTypeOperator',
  'TSTypePredicate',
  'TSTypeQuery',
  'TSTypeReference',
  'TSUndefinedKeyword',
  'TSUnionType',
  'TSUnknownKeyword',
  'TSVoidKeyword',
]);

function isTypeNode(node: ESTree.Node): node is ESTree.TSType {
  return typeNodeKinds.has(node.type);
}

function typeReferenceName(type: ESTree.TSTypeReference): string | null {
  return type.typeName.type === 'Identifier' ? type.typeName.name : null;
}

function isInsideTypeAliasDeclaration(node: ESTree.Node): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (current.type === 'TSTypeAliasDeclaration') return true;
    current = current.parent;
  }
  return false;
}

function isPlainAliasConsumerUse(node: ESTree.TSType, environment: TypeEnvironment): boolean {
  if (node.type !== 'TSTypeReference' || node.typeArguments?.params.length) return false;
  const name = typeReferenceName(node);
  return name !== null && environment.aliases.has(name) && !isInsideTypeAliasDeclaration(node);
}

/**
 * `T extends Record<string, unknown>` and `X extends Record<string, unknown> ? A : B`
 * only test a type argument. Code reads the argument type (`T[K]`), not the
 * dictionary values, so the constraint is not a value contract.
 */
function isInsideTypeTest(node: ESTree.Node): boolean {
  let descendant: ESTree.Node = node;
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (current.type === 'TSTypeParameter' && current.constraint === descendant) return true;
    if (current.type === 'TSConditionalType' && current.extendsType === descendant) return true;
    descendant = current;
    current = current.parent;
  }
  return false;
}

/**
 * Find the function whose parameter annotation contains `node`. Return `null`
 * when `node` is in another annotation (a return type, a variable, a field).
 */
function annotatedParameterFunction(node: ESTree.Node): ESTree.Node | null {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'TSTypeAnnotation') {
    if (!isTypeNode(current) && current.type !== 'TSTypeParameterInstantiation') return null;
    current = current.parent;
  }
  const holder = current?.parent ?? null;
  return holder === null ? null : parameterOwner(holder);
}

/**
 * A function expression is contextually typed when the code around it already
 * gives its parameter types: a call argument, a JSX expression, a `satisfies`
 * value, or an annotated variable, also through object and array literals.
 * @see https://www.typescriptlang.org/docs/handbook/type-inference.html#contextual-typing
 */
function isContextuallyTyped(fn: ESTree.Node): boolean {
  let current: ESTree.Node = fn;
  while (true) {
    const parent: ESTree.Node | null = current.parent;
    if (parent === null) return false;
    switch (parent.type) {
      case 'CallExpression':
      case 'NewExpression':
        return parent.arguments.some((argument) => argument === current);
      case 'JSXExpressionContainer':
        return true;
      case 'TSSatisfiesExpression':
        return parent.expression === current;
      case 'VariableDeclarator':
        return (
          parent.init === current &&
          parent.id.typeAnnotation !== undefined &&
          parent.id.typeAnnotation !== null
        );
      case 'Property':
        if (parent.value !== current) return false;
        current = parent.parent ?? parent;
        if (current.type !== 'ObjectExpression') return false;
        break;
      case 'ArrayExpression':
      case 'ParenthesizedExpression':
        current = parent;
        break;
      default:
        return false;
    }
  }
}

/**
 * `validateSearch: (search: Record<string, unknown>) => …` inside
 * `createRoute({ … })` repeats the parameter type that the library gives. The
 * annotation adds no type hole: without it, TypeScript infers the same type.
 */
function isContextualParameterAnnotation(node: ESTree.Node): boolean {
  const fn = annotatedParameterFunction(node);
  return (
    (fn?.type === 'ArrowFunctionExpression' || fn?.type === 'FunctionExpression') &&
    isContextuallyTyped(fn)
  );
}

function shouldReportType(
  node: ESTree.TSType,
  environment: TypeEnvironment,
  cache: WeakMap<ESTree.TSType, ReturnType<typeof classifyUnsafeDictionary>>,
): boolean {
  if (
    isPlainAliasConsumerUse(node, environment) ||
    isInsideTypeTest(node) ||
    isContextualParameterAnnotation(node)
  ) {
    return false;
  }
  const cachedClassify = (type: ESTree.TSType) => {
    const hit = cache.get(type);
    if (hit !== undefined) return hit;
    const classified = classifyUnsafeDictionary(type, environment);
    cache.set(type, classified);
    return classified;
  };
  if (cachedClassify(node) === null) return false;
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isTypeNode(current) && cachedClassify(current) !== null) return false;
    current = current.parent;
  }
  return true;
}

/** Disallow object-dictionary contracts whose direct value type is an unsafe escape hatch. */
export const noUnsafeDictionaryTypeName = bnRuleName('no-unsafe-dictionary-type');

export const noUnsafeDictionaryType: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches.',
    },
    messages: {
      unsafeDictionary: agentDiagnostic({
        problem:
          'This dictionary uses an unsafe {{value}} value type (`unknown`, `any`, `object`, `{}`, or a union/alias that contains those).',
        why: 'A map whose values have no owner type cannot be read safely. Every lookup becomes a guess or an assertion.',
        fix: 'Use `Record<string, NamedType>` (or a schema-derived value type). Parse each payload before insert. If keys are not free-form, use a named object type instead of a dictionary.',
        avoid:
          'Do not switch `unknown` to `any` or `object`. Do not add `as NamedType` at each read. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    let environment: TypeEnvironment | null = null;
    const classifyCache = new WeakMap<ESTree.TSType, ReturnType<typeof classifyUnsafeDictionary>>();
    const report = (node: ESTree.Node, value: string) => {
      context.report({ node, messageId: 'unsafeDictionary', data: { value } });
    };
    const reportIfUnsafe = (node: ESTree.TSType) => {
      if (environment === null || !shouldReportType(node, environment, classifyCache)) return;
      const unsafe = classifyUnsafeDictionary(node, environment);
      if (unsafe === null) return;
      report(node, unsafe.unsafeValue);
    };

    return {
      Program(node) {
        environment = createTypeEnvironment(node);
      },
      TSTypeReference: reportIfUnsafe,
      TSTypeLiteral: reportIfUnsafe,
      TSMappedType: reportIfUnsafe,
      TSIndexSignature(node) {
        if (
          environment === null ||
          node.typeAnnotation === null ||
          node.parent.type === 'TSTypeLiteral'
        )
          return;
        const unsafe = classifyUnsafeDictionaryValue(
          node.typeAnnotation.typeAnnotation,
          environment,
        );
        if (unsafe !== null) report(node, unsafe.unsafeValue);
      },
    };
  },
});
