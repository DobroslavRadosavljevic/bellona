import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isHookCall, isInsideRouteLifecycle } from '../route.ts';

export const noHooksInRouteLifecycleName = bnRuleName('no-hooks-in-route-lifecycle');

export const noHooksInRouteLifecycle: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow React hooks inside `beforeLoad` and `loader`',
    },
    messages: {
      hookInLifecycle: agentDiagnostic({
        problem:
          'A React hook is called inside `beforeLoad` or `loader`. Those callbacks are not React render functions.',
        why: 'Hooks need a component. In a loader they run on the server/navigation path and break the rules of hooks and router lifecycle.',
        fix: 'Put shared values on router `context`. For queries, call a non-hook API such as `queryClient.ensureQueryData` inside the loader. Use hooks only in route components.',
        avoid:
          'Do not wrap the hook in an inner function. Do not use `getRouteApi` to call hooks from the loader. Do not disable the rule.',
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
        if (isHookCall(node) && isInsideRouteLifecycle(node)) {
          context.report({ messageId: 'hookInLifecycle', node });
        }
      },
    };
  },
});
