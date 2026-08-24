import type { CreateOnceRule } from '@oxlint/plugins';

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
      missingFrom:
        'Pass `from` (e.g. `useLoaderData({ from: "/posts/$postId" })`) to narrow types, or `strict: false` for shared components. Do not use `getRouteApi` or `Route.useX()`.',
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
