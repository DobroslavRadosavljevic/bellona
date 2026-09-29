import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/** True when a function's first parameter destructures `{ error }` (the old Elysia context helper). */
const firstParamDestructuresError = (
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): boolean => {
  let [pattern] = fn.params;
  if (pattern?.type === 'AssignmentPattern') {
    pattern = pattern.left;
  }
  if (pattern?.type !== 'ObjectPattern') {
    return false;
  }
  return pattern.properties.some((property) => {
    if (property.type !== 'Property' || property.computed) {
      return false;
    }
    if (getStaticPropertyName(property.key) !== 'error') {
      return false;
    }
    const value =
      property.value.type === 'AssignmentPattern' ? property.value.left : property.value;
    return value.type === 'Identifier' && value.name === 'error';
  });
};

/**
 * True for a bare `error(…)` call whose `error` comes from a destructured
 * handler context (`({ error }) => error(404)`). Imported `error` helpers and
 * `logger.error(…)` do not match.
 */
const isContextErrorCall = (node: ESTree.CallExpression): boolean => {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'Identifier' || callee.name !== 'error') {
    return false;
  }
  let current: ESTree.Node | undefined = node.parent ?? undefined;
  while (current) {
    if (isFunctionLike(current)) {
      if (firstParamDestructuresError(current)) {
        return true;
      }
      if (current.params.some((param) => param.type === 'Identifier' && param.name === 'error')) {
        return false;
      }
    }
    current = current.parent ?? undefined;
  }
  return false;
};

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
        if (!isContextErrorCall(node)) {
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
        'Prefer status(code, value) over set.status or the removed context error() in Elysia handlers',
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
          'This handler calls `error()` from the handler context. Elysia 1.3 renamed it to `status`, and the Elysia 1.4 context has no `error`.',
        why: '`error()` is the old name. On Elysia 1.4 the destructured `error` does not exist, so the call fails. `status(code, value)` is the current API and gives typed responses.',
        fix: 'Replace `error(code, body)` with `return status(code, body)`.',
        avoid: 'Do not keep `error()` under an alias. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
