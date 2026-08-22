import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getCallName, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Prefer `status(code, value)` over `set.status = code` in Elysia handlers /
 * lifecycle hooks for typed responses / Eden narrowing.
 */
export const preferStatusHelperName = vmRuleName('prefer-status-helper');

export const preferStatusHelper: CreateOnceRule = defineVamanaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      AssignmentExpression(node) {
        if (node.operator !== '=') {
          return;
        }
        const left = unwrapExpression(node.left);
        if (left?.type !== 'MemberExpression') {
          return;
        }
        const property = left.computed
          ? left.property.type === 'Literal' && left.property.value === 'status'
          : getStaticPropertyName(left.property) === 'status';
        if (!property) {
          return;
        }
        const object = unwrapExpression(left.object);
        if (object?.type !== 'Identifier' || object.name !== 'set') {
          return;
        }
        if (!isInsideElysiaHandlerContext(node)) {
          return;
        }
        context.report({ messageId: 'preferStatus', node });
      },
      CallExpression(node) {
        if (getCallName(node) !== 'error') {
          return;
        }
        if (!isInsideElysiaHandlerContext(node)) {
          return;
        }
        context.report({ messageId: 'preferStatusOverError', node });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Prefer status(code, value) over set.status or deprecated error() in Elysia handlers',
    },
    messages: {
      preferStatus:
        'Prefer `status(code, value)` over `set.status`. It preserves response typing and Eden narrowing.',
      preferStatusOverError:
        'Prefer `status(code, value)` over deprecated `error()`. Elysia 1.3+ renamed context `error` to `status`.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
