import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getCallName, getMemberRootName, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipZodFile } from '../options.ts';

const FORMAT_METHODS = new Set(['email', 'url', 'uuid']);

export const zodModernFormatValidatorsName = vmRuleName('zod-modern-format-validators');

export const zodModernFormatValidators: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer z.email() / z.url() / z.uuid() over z.string().email() style chains',
    },
    messages: {
      preferTopLevel: 'Use z.{{method}}() instead of z.string().{{method}}().',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipZodFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }

        const method = getStaticPropertyName(callee.property);
        if (method === undefined || !FORMAT_METHODS.has(method)) {
          return;
        }

        const object = unwrapExpression(callee.object);
        if (
          object?.type === 'CallExpression' &&
          (getCallName(object) ?? '').split('.').at(-1) === 'string' &&
          getMemberRootName(object.callee) === 'z'
        ) {
          context.report({
            messageId: 'preferTopLevel',
            data: { method },
            node,
          });
        }
      },
    };
  },
});
