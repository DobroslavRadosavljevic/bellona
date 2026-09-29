import type { CreateOnceRule, ESTree, SourceCode } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, isAllowedFile } from '../options.ts';
import { isGlobalIdentifier, staticPropertyName } from '../shared/scope.ts';

type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

function isJsonParseCall(sourceCode: SourceCode, node: ESTree.CallExpression): boolean {
  const { callee } = node;
  return (
    callee.type === 'MemberExpression' &&
    staticPropertyName(callee) === 'parse' &&
    isGlobalIdentifier(sourceCode, callee.object, 'JSON')
  );
}

/** `await response.json()`: a zero-argument `.json()` call, awaited. */
function isAwaitedJsonBody(node: ESTree.AwaitExpression): boolean {
  const argument = node.argument;
  return (
    argument.type === 'CallExpression' &&
    argument.arguments.length === 0 &&
    argument.callee.type === 'MemberExpression' &&
    staticPropertyName(argument.callee) === 'json'
  );
}

function isUnknownType(type: ESTree.TSType): boolean {
  let current = type;
  while (current.type === 'TSParenthesizedType') current = current.typeAnnotation;
  return current.type === 'TSUnknownKeyword';
}

function isUnknownOrPromiseOfUnknown(type: ESTree.TSType): boolean {
  if (isUnknownType(type)) return true;
  if (
    type.type !== 'TSTypeReference' ||
    type.typeName.type !== 'Identifier' ||
    type.typeName.name !== 'Promise'
  ) {
    return false;
  }
  const [value] = type.typeArguments?.params ?? [];
  return value !== undefined && isUnknownType(value);
}

function enclosingFunction(node: ESTree.Node): FunctionNode | null {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression'
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function returnsUnknown(owner: FunctionNode | null): boolean {
  const annotation = owner?.returnType?.typeAnnotation;
  return annotation !== undefined && isUnknownOrPromiseOfUnknown(annotation);
}

/**
 * Find how the `any` value leaves the expression. Return a short label for the
 * leak, or `null` when the value goes to a checked place: a `: unknown`
 * binding, a call argument (a schema decode), `as unknown`, or `satisfies`.
 */
function leakKind(source: ESTree.Expression): string | null {
  let node: ESTree.Node = source;
  let parent = node.parent;
  while (parent?.type === 'ParenthesizedExpression') {
    node = parent;
    parent = parent.parent;
  }
  if (parent === null) return null;
  switch (parent.type) {
    case 'VariableDeclarator': {
      if (parent.init !== node) return null;
      const annotation = parent.id.typeAnnotation?.typeAnnotation;
      if (annotation === undefined) return 'an unannotated binding';
      return isUnknownType(annotation) ? null : 'a binding annotated with a domain type';
    }
    case 'ReturnStatement':
      return returnsUnknown(enclosingFunction(parent)) ? null : 'a return value';
    case 'ArrowFunctionExpression':
      return parent.body === node && !returnsUnknown(parent) ? 'a return value' : null;
    case 'MemberExpression':
      return parent.object === node ? 'a member access' : null;
    case 'TSAsExpression':
    case 'TSTypeAssertion':
      return isUnknownType(parent.typeAnnotation) ? null : 'a type assertion';
    default:
      return null;
  }
}

/** Ban `JSON.parse` and `await response.json()` results that flow on as `any`. */
export const noUntypedJsonName = bnRuleName('no-untyped-json');

export const noUntypedJson: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow JSON.parse and awaited .json() results that leak as any; keep them unknown and parse them.',
    },
    messages: {
      untypedJson: agentDiagnostic({
        problem:
          'The result of `{{source}}` has type `any`, and this code sends it to {{leak}} without a check.',
        why: 'TypeScript types `JSON.parse` as `any` and `Response.json()` as `Promise<any>`. An `any` value turns off type checks for each later use, and TypeScript shows no error.',
        fix: 'Pass the value straight to a decoder: `UserSchema.parse(JSON.parse(text))`. Or keep it as `const data: unknown = JSON.parse(text)` and parse `data` before use.',
        avoid:
          'Do not add `as User`. Do not annotate the binding with a domain type (`const user: User = JSON.parse(text)`): that is the same unchecked cast. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const check = (source: ESTree.Expression, label: string) => {
      const leak = leakKind(source);
      if (leak === null) return;
      context.report({ node: source, messageId: 'untypedJson', data: { source: label, leak } });
    };

    return {
      before() {
        if (isAllowedFile(context)) return false;
      },
      CallExpression(node) {
        if (isJsonParseCall(context.sourceCode, node)) check(node, 'JSON.parse(…)');
      },
      AwaitExpression(node) {
        if (isAwaitedJsonBody(node)) check(node, 'await ….json()');
      },
    };
  },
});
