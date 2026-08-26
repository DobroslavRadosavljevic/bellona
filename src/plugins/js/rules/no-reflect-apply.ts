import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isGlobalReflectMethodCall } from '../shared/reflect-method.ts';

/** Ban Reflect.apply, which bypasses ordinary typed function calls. */
export const noReflectApplyName = bnRuleName('no-reflect-apply');

export const noReflectApply: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Reflect.apply; call typed functions directly or model dynamic dispatch behind an interface.',
    },
    messages: {
      reflectApply: agentDiagnostic({
        problem:
          'This call uses `Reflect.apply`. That API invokes a function without a typed call site (`fn(...args)` or `fn.call` / `fn.apply` with known types).',
        why: 'Reflect.apply hides the callee and the argument list from TypeScript. Dispatch becomes stringly typed and skips ordinary call checking.',
        fix: 'Call the function directly: `fn(a, b)`. If dispatch is dynamic, model it behind a named interface or a closed union of callables, then call that.',
        avoid:
          'Do not replace `Reflect.apply` with `Function.prototype.apply.call` or `eval`. Do not assert the result. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Super' || node.callee.type === 'V8IntrinsicExpression') return;
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, 'apply')) {
          context.report({ node, messageId: 'reflectApply' });
        }
      },
    };
  },
});
