import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapParentheses } from '../shared/scope.ts';

export const noIifeName = bnRuleName('no-iife');

/**
 * Reports a call whose callee is the function written in place:
 * `(() => x)()`, `(function () {})()`, `(async () => {})()`. Parentheses are
 * removed first, so the rule works whether the parser keeps them or not.
 * A named call (`run()`), `fn.call()`, and `new (class {})()` are not IIFEs.
 */
export const noIife: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow immediately invoked function expressions. Give the value or the behavior a name instead.',
    },
    messages: {
      iife: agentDiagnostic({
        problem:
          'A function is called where it is written (an immediately invoked function expression, IIFE).',
        why: 'An IIFE hides a value or a behavior with no name. In a React component it is built again on every render, and it hides state from the reader and from the React Compiler.',
        fix: 'Derive the value plainly. Move a reusable step to a named module function. Put stateful behavior in a hook or a state owner. In modules and scripts, use top-level `await` instead of an async IIFE.',
        avoid:
          'Do not rename the IIFE into a nested function that is called once in the same place. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Super') return;
        const callee = unwrapParentheses(node.callee);
        if (callee.type !== 'ArrowFunctionExpression' && callee.type !== 'FunctionExpression') {
          return;
        }
        context.report({ node, messageId: 'iife' });
      },
    };
  },
});
