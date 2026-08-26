import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isNotFoundHandled, isRouterNotFoundCall } from '../route.ts';

export const requireThrowNotFoundName = bnRuleName('require-throw-not-found');

export const requireThrowNotFound: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `throw notFound(...)` or `notFound({ throw: true })`',
    },
    messages: {
      throwNotFound: agentDiagnostic({
        problem:
          '`notFound()` is called without throwing, returning, or `{ throw: true }`. A bare call does nothing to the loader.',
        why: 'The route keeps running and is not typed as missing. Users see a success path for a missing record.',
        fix: 'Use `throw notFound()`, `return notFound()`, or `notFound({ throw: true })` inside `loader` / `beforeLoad`.',
        avoid: 'Do not `return null` instead. Do not disable the rule.',
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
        if (!isRouterNotFoundCall(node) || isNotFoundHandled(node)) {
          return;
        }
        context.report({ messageId: 'throwNotFound', node });
      },
    };
  },
});
