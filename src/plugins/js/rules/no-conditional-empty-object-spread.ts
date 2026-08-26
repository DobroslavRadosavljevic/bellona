import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

function unwrapParentheses(node: ESTree.Expression): ESTree.Expression {
  let current = node;
  while (current.type === 'ParenthesizedExpression') {
    current = current.expression;
  }
  return current;
}

function isEmptyObjectExpression(node: ESTree.Expression): boolean {
  return node.type === 'ObjectExpression' && node.properties.length === 0;
}

function isConditionalEmptyObjectSpread(node: ESTree.Expression): boolean {
  const conditional = unwrapParentheses(node);
  return (
    conditional.type === 'ConditionalExpression' &&
    (isEmptyObjectExpression(conditional.consequent) ||
      isEmptyObjectExpression(conditional.alternate))
  );
}

/** Ban conditional empty-object spreads without changing their omission semantics. */
export const noConditionalEmptyObjectSpreadName = bnRuleName('no-conditional-empty-object-spread');

export const noConditionalEmptyObjectSpread: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow object spreads that conditionally spread an empty object to omit fields.',
    },
    messages: {
      avoid: agentDiagnostic({
        problem:
          'This object spread uses a condition that yields `{}` (`{ ...cond && {} }` or `{ ...(cond ? extra : {}) }`). An empty object is spread only to omit fields.',
        why: 'The empty object hides whether a property exists. Readers and types cannot see the real object shape.',
        fix: 'Build the object with statements. Start with the required fields, then assign extra fields only when the condition is true. Example: `const out = { a }; if (cond) out.b = value; return out`.',
        avoid:
          'Do not replace `{}` with `Object.create(null)`, a dummy property, or `as const`. Do not keep the spread and add a comment. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    return {
      SpreadElement(node) {
        if (node.parent.type !== 'ObjectExpression') return;

        if (isConditionalEmptyObjectSpread(node.argument)) {
          context.report({ node, messageId: 'avoid' });
        }
      },
    };
  },
});
