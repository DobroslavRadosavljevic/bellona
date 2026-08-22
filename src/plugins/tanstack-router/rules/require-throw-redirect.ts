import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isRedirectHandled, isRouterRedirectCall } from '../route.ts';

export const requireThrowRedirectName = vmRuleName('require-throw-redirect');

export const requireThrowRedirect: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `redirect(...)` to be thrown, returned, or called with `throw: true`',
    },
    messages: {
      throwRedirect:
        'Use `throw redirect({ to })`, `return redirect({ to })`, or `redirect({ to, throw: true })`. A bare call does not navigate.',
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
        if (!isRouterRedirectCall(node) || isRedirectHandled(node)) {
          return;
        }
        context.report({ messageId: 'throwRedirect', node });
      },
    };
  },
});
