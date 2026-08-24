import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsNumber } from '../../../lib/js-kind.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import {
  getObjectPropertyValue,
  isElysiaStatusCall,
  isInsideElysiaHandlerContext,
  isStringLiteralOrConstString,
} from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Whether `status(code, …)` should validate an `{ code, message }` body.
 * Numeric literals ≥400 always qualify; identifier codes qualify when the body
 * has a `code` key (status value is unknown statically).
 */
const shouldCheckErrorBody = (
  codeArg: ESTree.Expression | ESTree.SpreadElement | undefined,
  hasCodeKey: boolean,
): boolean => {
  if (!codeArg || codeArg.type === 'SpreadElement') {
    return false;
  }
  const code = unwrapExpression(codeArg);
  if (!code) {
    return false;
  }
  if (code.type === 'Literal' && isJsNumber(code.value)) {
    return code.value >= 400;
  }
  if (code.type === 'Identifier') {
    return hasCodeKey;
  }
  return false;
};

/**
 * Require `status(4xx|5xx, { code: X, message })` to use a string Literal (or
 * const string Identifier) for `code`: not templates or member access.
 * `message` may be dynamic (e.g. permission text).
 */
export const requireErrorBodyLiteralName = bnRuleName('elysia', 'require-error-body-literal');

export const requireErrorBodyLiteral: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (!isElysiaStatusCall(node) || !isInsideElysiaHandlerContext(node)) {
          return;
        }

        const [codeArg, bodyArg] = node.arguments;
        if (!bodyArg || bodyArg.type === 'SpreadElement') {
          return;
        }

        const body = unwrapExpression(bodyArg);
        if (body?.type !== 'ObjectExpression') {
          return;
        }

        const codeValue = getObjectPropertyValue(body, 'code');
        if (!codeValue) {
          return;
        }

        if (!shouldCheckErrorBody(codeArg, true)) {
          return;
        }

        if (isStringLiteralOrConstString(codeValue)) {
          return;
        }

        context.report({ messageId: 'nonLiteralCode', node: codeValue });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require status(4xx|5xx, { code }) values to be string literals or const strings',
    },
    messages: {
      nonLiteralCode:
        '`status(..., { code })` must use a string literal or a same-file const string, not templates or member access.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
