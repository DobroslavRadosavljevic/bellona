import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { objectHasOwnProperty } from '../router.ts';

export const requireRouterHookFromName = bnRuleName('require-hook-from');

/**
 * `useParams`, `useSearch`, `useLoaderData`, and `useRouteContext` are not checked here.
 * Their `StrictOrFrom` option type already requires `from` or `strict: false`
 * (`router-core/dist/esm/utils.d.ts`). `useNavigate` has an optional `from` and no `strict`.
 */
export const requireRouterHookFrom: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `from` on bare `useNavigate` calls',
    },
    messages: {
      navigateMissingFrom: agentDiagnostic({
        problem: '`useNavigate` has no `{ from }`.',
        why: 'Without `from`, TypeScript cannot tie a relative `to` or the `search` / `params` updater functions to this route. `useNavigate` has no `strict` option.',
        fix: 'Pass the literal route path of the component that navigates: `useNavigate({ from: "/posts/$postId" })`. A shared component that uses only absolute `to` paths can pass `from: "/"`.',
        avoid:
          'Do not pass `{ strict: false }` to `useNavigate`. Do not assert the navigate options. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'Identifier' || callee.name !== 'useNavigate') {
          return;
        }
        const first = node.arguments[0];
        const options = first === undefined || first.type === 'SpreadElement' ? undefined : first;
        if (!objectHasOwnProperty(options, 'from')) {
          context.report({ messageId: 'navigateMissingFrom', node });
        }
      },
    };
  },
});
