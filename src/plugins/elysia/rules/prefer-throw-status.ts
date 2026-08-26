import type { CreateOnceRule } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallName, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Prefer `return status(...)` over `throw new Error(...)` or string throws
 * inside Elysia handlers / lifecycle hooks. (`throw status(...)` remains
 * valid for onError-style paths.)
 */
export const preferThrowStatusName = bnRuleName('prefer-throw-status');

export const preferThrowStatus: CreateOnceRule = defineBellonaRule({
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
      throwError: agentDiagnostic({
        problem:
          'This handler throws `new Error(...)` instead of returning `status(code, value)`. `throw status(...)` is allowed for onError-style paths.',
        why: 'Thrown `Error` is untyped HTTP. Eden and `response` schemas cannot see the status or body.',
        fix: 'Return `status(code, { code: "…", message: "…" })` with a literal error `code`. Use `throw status(...)` only when you must enter `onError`.',
        avoid: 'Do not throw a string. Do not disable the rule.',
      }),
      throwLiteral: agentDiagnostic({
        problem: 'This handler throws a string. That is not a typed Elysia response.',
        why: 'String throws skip `status()` and response schemas. Clients cannot narrow the error.',
        fix: 'Return `status(code, { code: "literal_code", message: "…" })` instead of `throw "…"`.',
        avoid: 'Do not throw `new Error(string)` as a substitute. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
