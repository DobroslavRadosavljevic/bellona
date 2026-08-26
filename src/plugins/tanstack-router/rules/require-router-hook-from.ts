import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { hasFromOrStrictFalse, isBareRouterHookCall } from '../router.ts';

export const requireRouterHookFromName = bnRuleName('require-hook-from');

export const requireRouterHookFrom: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `from` or `strict: false` on bare TanStack Router hooks',
    },
    messages: {
      missingFrom: agentDiagnostic({
        problem:
          'This router hook (`useNavigate` / `useParams` / `useSearch` / `useLoaderData` / `useRouteContext`) has no `{ from }` and no `{ strict: false }`.',
        why: 'Without `from`, the hook cannot narrow to a route’s params, search, or loader data.',
        fix: 'Pass a literal route id: `useLoaderData({ from: "/posts/$postId" })`. For shared components, pass `{ strict: false }` or take the data as props. Do not use `getRouteApi` or `Route.useX()`.',
        avoid: 'Do not assert the hook result. Do not disable the rule.',
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
        if (!isBareRouterHookCall(node)) {
          return;
        }
        const first = node.arguments[0];
        if (first !== undefined && first.type !== 'SpreadElement' && hasFromOrStrictFalse(first)) {
          return;
        }
        context.report({ messageId: 'missingFrom', node });
      },
    };
  },
});
