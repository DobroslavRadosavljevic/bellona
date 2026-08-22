import type { CreateOnceRule } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getCallName, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Prefer `return status(...)` over `throw new Error(...)` or string throws
 * inside Elysia handlers / lifecycle hooks. (`throw status(...)` remains
 * valid for onError-style paths.)
 */
export const preferThrowStatusName = vmRuleName('prefer-throw-status');

export const preferThrowStatus: CreateOnceRule = defineVamanaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      ThrowStatement(node) {
        if (!isInsideElysiaHandlerContext(node)) {
          return;
        }
        const argument = unwrapExpression(node.argument);
        if (!argument) {
          return;
        }

        if (argument.type === 'CallExpression' && getCallName(argument) === 'status') {
          return;
        }

        if (
          argument.type === 'NewExpression' &&
          argument.callee.type === 'Identifier' &&
          argument.callee.name.endsWith('Error')
        ) {
          context.report({ messageId: 'throwError', node });
          return;
        }

        if (argument.type === 'Literal' && isJsString(argument.value)) {
          context.report({ messageId: 'throwLiteral', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description: 'Prefer return status() over throw new Error/string in Elysia handlers',
    },
    messages: {
      throwError: 'Prefer `return status(code, value)` over `throw new Error(...)`.',
      throwLiteral: 'Prefer `return status(code, value)` over throwing a string.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
