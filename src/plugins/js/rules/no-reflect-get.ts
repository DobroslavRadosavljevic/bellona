import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
      reflectGet: agentDiagnostic({
        problem:
          'This call uses `Reflect.get`. That API reads a property by a runtime key and returns `unknown`-like access, not a typed field.',
        why: 'Typed property access (`value.field`) is how TypeScript proves the field exists. Reflect.get skips that proof.',
        fix: 'Use `value.field` or a named key on a closed type. If the key is external input, parse it into a named type first, then read a known field.',
        avoid:
          'Do not replace `Reflect.get` with `value[key] as T` or `Object.getOwnPropertyDescriptor`. Do not disable the rule.',
      }),
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
