import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isNotFoundHandled, isRouterNotFoundCall } from '../route.ts';

export const requireThrowNotFoundName = bnRuleName('tanstack-router', 'require-throw-not-found');

export const requireThrowNotFound: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `throw notFound(...)` or `notFound({ throw: true })`',
    },
    messages: {
      throwNotFound:
        'Use `throw notFound()` or `notFound({ throw: true })`. A bare call does not stop the loader or type the route as missing.',
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
        if (!isRouterNotFoundCall(node) || isNotFoundHandled(node)) {
          return;
        }
        context.report({ messageId: 'throwNotFound', node });
      },
    };
  },
});
