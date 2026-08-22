import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isThrowArgument } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isNamedCall } from '../route.ts';

export const requireThrowRedirectName = vmRuleName('require-throw-redirect');

export const requireThrowRedirect: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `throw redirect(...)` / `throw Route.redirect(...)`',
    },
    messages: {
      throwRedirect:
        'Throw the redirect result: `throw redirect({ to: "/login" })` or `throw Route.redirect({ to: "../login" })`. A bare call does not navigate.',
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
        if (!isNamedCall(node, 'redirect') || isThrowArgument(node)) {
          return;
        }
        context.report({ messageId: 'throwRedirect', node });
      },
    };
  },
});
