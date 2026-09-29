import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { resolveIdentifierInit } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipNonTestFile } from '../options.ts';

/** `new Request(…)`, directly or through a same-file `const`. */
const isNewRequest = (node: ESTree.Node | undefined): boolean => {
  const expression = resolveIdentifierInit(node) ?? unwrapExpression(node);
  if (expression?.type !== 'NewExpression') {
    return false;
  }
  const callee = unwrapExpression(expression.callee);
  return callee?.type === 'Identifier' && callee.name === 'Request';
};

/**
 * In `*.test.*` / `*.spec.*` files, disallow `app.handle(new Request(…))`.
 * Use `treaty(app)` from `@elysia/eden`: it calls the app in process and types
 * every request and response from the app type.
 *
 * @see https://elysiajs.com/eden/treaty/unit-test
 */
export const preferEdenTreatyInTestsName = bnRuleName('prefer-eden-treaty-in-tests');

export const preferEdenTreatyInTests: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipNonTestFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (
          callee?.type !== 'MemberExpression' ||
          getStaticPropertyName(callee.property) !== 'handle'
        ) {
          return;
        }
        const [first] = node.arguments;
        if (!first || first.type === 'SpreadElement' || !isNewRequest(first)) {
          return;
        }
        context.report({ messageId: 'preferTreaty', node });
      },
    };
  },
  meta: {
    docs: {
      description: 'Prefer @elysia/eden treaty(app) over app.handle(new Request(…)) in tests',
    },
    messages: {
      preferTreaty: agentDiagnostic({
        problem:
          'This test calls the Elysia app with `app.handle(new Request(…))`. The request and the response are untyped.',
        why: '`treaty(app)` from `@elysia/eden` also calls the app in process, with no network. It types each path, body, query, and response from the app type, so a route change breaks the test at compile time.',
        fix: 'Write `const api = treaty(app)` (import `treaty` from `@elysia/eden`). Call `const { data, error, status } = await api.users({ id }).get()` and assert on those fields.',
        avoid:
          'Do not wrap `app.handle(new Request(…))` in a request helper. Do not parse `response.json()` by hand. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
