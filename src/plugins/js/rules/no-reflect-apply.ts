import type { CreateOnceRule } from '@oxlint/plugins';

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
      reflectApply:
        'Replace `Reflect.apply` with a typed function call. Model dynamic dispatch behind a named interface.',
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
