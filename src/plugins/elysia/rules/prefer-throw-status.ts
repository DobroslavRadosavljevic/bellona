import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallName, unwrapExpression } from '../ast.ts';
import { isInsideElysiaHandlerContext } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Built-in JavaScript error constructors. They carry no HTTP status, so Elysia
 * answers with 500. Custom classes (Elysia `NotFoundError`, or a class with
 * `status` / `toResponse()`) are a documented Elysia pattern and are not reported.
 *
 * @see https://elysiajs.com/patterns/error-handling.html#custom-error
 */
const BUILT_IN_ERROR_CONSTRUCTORS = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'EvalError',
  'URIError',
  'AggregateError',
]);

/** `new Error(…)` or `Error(…)` for a built-in error constructor. */
const isBuiltInErrorConstruction = (node: ESTree.Node): boolean => {
  if (node.type !== 'NewExpression' && node.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && BUILT_IN_ERROR_CONSTRUCTORS.has(callee.name);
};

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

        if (isBuiltInErrorConstruction(argument)) {
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
          'This handler throws a built-in `Error` (`Error`, `TypeError`, …) instead of returning `status(code, value)`. `throw status(...)` is allowed for onError-style paths.',
        why: 'A built-in `Error` has no HTTP status, so Elysia answers 500. Eden and `response` schemas cannot see the status or body.',
        fix: 'Return `status(code, { code: "…", message: "…" })` with a literal error `code`. Use `throw status(...)` only when you must enter `onError`. A custom error class with `status` and `toResponse()` is also valid.',
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
