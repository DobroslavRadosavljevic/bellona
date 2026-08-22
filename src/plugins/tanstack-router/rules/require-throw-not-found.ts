import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isThrowArgument } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isNamedCall } from '../route.ts';

export const requireThrowNotFoundName = vmRuleName('require-throw-not-found');

export const requireThrowNotFound: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `throw notFound(...)`',
    },
    messages: {
      throwNotFound:
        'Throw the not-found result: `throw notFound()`. A bare call does not stop the loader or type the route as missing.',
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
        if (!isNamedCall(node, 'notFound') || isThrowArgument(node)) {
          return;
        }
        context.report({ messageId: 'throwNotFound', node });
      },
    };
  },
});
