import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isGlobalReflectMethodCall } from '../shared/reflect-method.ts';

/** Ban Reflect.get, which bypasses ordinary property access and useful type evidence. */
export const noReflectGetName = bnRuleName('no-reflect-get');

export const noReflectGet: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Reflect.get; use typed property access or parse dynamic input into a domain type.',
    },
    messages: {
      reflectGet:
        'Replace `Reflect.get` with typed property access. Parse dynamic input into a named domain type before reading it.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Super' || node.callee.type === 'V8IntrinsicExpression') return;
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, 'get')) {
          context.report({ node, messageId: 'reflectGet' });
        }
      },
    };
  },
});
