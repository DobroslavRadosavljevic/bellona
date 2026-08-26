import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { isCookieJarMember } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/** Whether a literal is `null` or `undefined`. */
const isNullishLiteral = (node: ReturnType<typeof unwrapExpression>): boolean =>
  node?.type === 'Literal' && (node.value === null || node.value === undefined);

const isUndefinedIdentifier = (node: ReturnType<typeof unwrapExpression>): boolean =>
  node?.type === 'Identifier' && node.name === 'undefined';

/**
 * Elysia `cookie.name` is a Proxy that is always defined: check
 * `cookie.name.value` instead of treating the jar entry as optional.
 */
export const noCookieUndefinedCheckName = bnRuleName('no-cookie-undefined-check');

export const noCookieUndefinedCheck: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    /** Report when a cookie jar member is used in a nullish check. */
    const reportJar = (node: ESTree.Node | undefined) => {
      if (node && isCookieJarMember(node)) {
        context.report({ messageId: 'cookieCheck', node });
      }
    };

    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      UnaryExpression(node) {
        if (node.operator === '!') {
          reportJar(node.argument);
        }
      },
      BinaryExpression(node) {
        if (
          node.operator !== '==' &&
          node.operator !== '===' &&
          node.operator !== '!=' &&
          node.operator !== '!=='
        ) {
          return;
        }
        const left = unwrapExpression(node.left);
        const right = unwrapExpression(node.right);
        const leftTypeof =
          left?.type === 'UnaryExpression' && left.operator === 'typeof' ? left : undefined;
        const rightTypeof =
          right?.type === 'UnaryExpression' && right.operator === 'typeof' ? right : undefined;
        if (leftTypeof && right?.type === 'Literal' && right.value === 'undefined') {
          reportJar(leftTypeof.argument);
          return;
        }
        if (rightTypeof && left?.type === 'Literal' && left.value === 'undefined') {
          reportJar(rightTypeof.argument);
          return;
        }
        let cookieSide: ESTree.Node | undefined = undefined;
        if (isCookieJarMember(left)) {
          cookieSide = left;
        } else if (isCookieJarMember(right)) {
          cookieSide = right;
        }
        if (!cookieSide) {
          return;
        }
        const other = cookieSide === left ? right : left;
        if (isNullishLiteral(other) || isUndefinedIdentifier(other)) {
          context.report({ messageId: 'cookieCheck', node });
        }
      },
      IfStatement(node) {
        reportJar(node.test);
      },
      ConditionalExpression(node) {
        reportJar(node.test);
      },
      LogicalExpression(node) {
        reportJar(node.left);
      },
    };
  },
  meta: {
    docs: {
      description: 'Do not treat Elysia cookie jar entries as undefined; check .value instead',
    },
    messages: {
      cookieCheck: agentDiagnostic({
        problem:
          'This code checks Elysia `cookie.<name>` for null/undefined (`cookie.sid == null`, `!cookie.sid`, and similar). `cookie.<name>` is a Proxy that always exists.',
        why: 'The check is always false/true in the wrong way. Missing cookies show up on `.value`, not on the cookie object.',
        fix: 'Read `cookie.<name>.value` (and schema-parse it). Guard `if (cookie.sid.value === undefined)` or use the typed cookie schema on the route.',
        avoid: 'Do not keep `if (cookie.sid)`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
