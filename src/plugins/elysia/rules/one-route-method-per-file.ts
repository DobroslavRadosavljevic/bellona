import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isElysiaRouteMethodCall } from '../elysia.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipElysiaRoutesLeaf,
} from '../options.ts';

/**
 * Leaf `routes/<action>.ts` files may register at most one Elysia route method
 * (`.get` / `.post` / …). Mount tables belong in `routes/index.ts`.
 */
export const oneRouteMethodPerFileName = vmRuleName('one-route-method-per-file');

export const oneRouteMethodPerFile: CreateOnceRule = defineVamanaRule({
  createOnce(context) {
    let routeMethodCount = 0;

    return {
      before() {
        routeMethodCount = 0;
        if (shouldSkipElysiaRoutesLeaf(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (!isElysiaRouteMethodCall(node)) {
          return;
        }
        routeMethodCount += 1;
        if (routeMethodCount > 1) {
          context.report({
            messageId: 'extraRoute',
            node,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      description: 'Allow at most one Elysia route method (.get/.post/…) per routes leaf file',
    },
    messages: {
      extraRoute:
        'Routes leaf files may declare only one Elysia route method. Split extra verbs into separate files, or mount them from `routes/index.ts`.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
