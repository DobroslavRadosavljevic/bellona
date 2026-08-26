import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isRedirectHandled, isRouterRedirectCall } from '../route.ts';

export const requireThrowRedirectName = bnRuleName('require-throw-redirect');

export const requireThrowRedirect: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `redirect(...)` to be thrown, returned, or called with `throw: true`',
    },
    messages: {
      throwRedirect: agentDiagnostic({
        problem:
          '`redirect({ to })` is called without throwing, returning, or `{ throw: true }`. A bare call does not navigate.',
        why: 'The loader continues as if navigation did not happen. Redirects must stop the current flow.',
        fix: 'Use `throw redirect({ to: "/login" })`, `return redirect({ to })`, or `redirect({ to, throw: true })` with a literal `to` and `params` as needed.',
        avoid: 'Do not use `location.assign` instead. Do not disable the rule.',
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
        if (!isRouterRedirectCall(node) || isRedirectHandled(node)) {
          return;
        }
        context.report({ messageId: 'throwRedirect', node });
      },
    };
  },
});
