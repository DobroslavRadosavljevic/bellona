import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallName, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Prefer `status(code, value)` over `set.status = code` in Elysia handlers /
 * lifecycle hooks for typed responses / Eden narrowing.
 */
export const preferStatusHelperName = bnRuleName('prefer-status-helper');

export const preferStatusHelper: CreateOnceRule = defineBellonaRule({
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
      preferStatus: agentDiagnostic({
        problem: 'This handler sets the status with `set.status` instead of `status(code, value)`.',
        why: '`set.status` does not preserve Eden / response typing the way `status()` does. Clients then miss status unions.',
        fix: 'Return `status(code, body)` (import `status` from `elysia`). Example: `return status(404, { code: "not_found" })`.',
        avoid: 'Do not assign `set.status` and return a body separately. Do not disable the rule.',
      }),
      preferStatusOverError: agentDiagnostic({
        problem:
          'This handler uses deprecated context `error()`. Elysia 1.3+ renamed it to `status`.',
        why: '`error()` is the old name. Typed responses and Eden expect `status(code, value)`.',
        fix: 'Replace `error(code, body)` with `return status(code, body)`.',
        avoid: 'Do not keep `error()` under an alias. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
