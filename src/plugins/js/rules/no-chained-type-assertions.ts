import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

type TypeAssertionExpression = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

function isTypeAssertionExpression(node: ESTree.Node): node is TypeAssertionExpression {
  return node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion';
}

function unwrapParenthesizedExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (current.type === 'ParenthesizedExpression') {
    current = current.expression;
  }
  return current;
}

function isConstAssertion(node: TypeAssertionExpression): boolean {
  const { typeAnnotation } = node;
  return (
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName.type === 'Identifier' &&
    typeAnnotation.typeName.name === 'const'
  );
}

function isOutermostAssertionInChain(node: TypeAssertionExpression): boolean {
  let current: ESTree.Expression = node;
  let parent = node.parent;

  while (parent.type === 'ParenthesizedExpression' && parent.expression === current) {
    current = parent;
    parent = parent.parent;
  }

  return !isTypeAssertionExpression(parent) || parent.expression !== current;
}

function isForbiddenAssertionChain(node: TypeAssertionExpression): boolean {
  let assertionCount = 0;
  let hasNonConstAssertion = false;
  let current: ESTree.Expression = node;

  while (isTypeAssertionExpression(current)) {
    assertionCount += 1;
    hasNonConstAssertion ||= !isConstAssertion(current);
    current = unwrapParenthesizedExpression(current.expression);
  }

  return assertionCount > 1 && hasNonConstAssertion;
}

/** Disallow nested TypeScript type assertions, while permitting chains made only of const assertions. */
export const noChainedTypeAssertionsName = bnRuleName('no-chained-type-assertions');

export const noChainedTypeAssertions: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains.',
    },
    messages: {
      chained: agentDiagnostic({
        problem:
          'This is a chained type assertion (`value as A as B` or `(value as A) as B`, including angle-bracket `<T>x`). A chain of only `as const` is allowed.',
        why: 'Each extra assertion discards the type TypeScript already proved and invents a new one. Callers then trust a type that was never parsed.',
        fix: 'Keep the original precise type. If the value is untrusted (JSON, network, unknown), parse it once at the I/O boundary with a schema (Zod, Effect Schema) into a named type. Then use that named type with no assertion.',
        avoid:
          'Do not add more assertions, wrap the chain in parentheses, switch `as` to angle-bracket form, or disable the rule. Do not use `as unknown as T` as a substitute.',
      }),
    },
  },
  createOnce(context) {
    const checkTypeAssertion = (node: TypeAssertionExpression) => {
      if (!isOutermostAssertionInChain(node) || !isForbiddenAssertionChain(node)) return;
      context.report({ node, messageId: 'chained' });
    };

    return {
      TSAsExpression: checkTypeAssertion,
      TSTypeAssertion: checkTypeAssertion,
    };
  },
});
