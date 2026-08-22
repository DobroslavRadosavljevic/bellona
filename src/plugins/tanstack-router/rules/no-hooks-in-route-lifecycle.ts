import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isHookCall, isInsideRouteLifecycle } from '../route.ts';

export const noHooksInRouteLifecycleName = vmRuleName('no-hooks-in-route-lifecycle');

export const noHooksInRouteLifecycle: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow React hooks inside `beforeLoad` and `loader`',
    },
    messages: {
      hookInLifecycle:
        'Do not call hooks in `beforeLoad` or `loader`. Put shared values on router `context`, or call data APIs that are not hooks (`ensureQueryData`).',
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
