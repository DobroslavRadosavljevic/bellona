import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
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
export const oneRouteMethodPerFileName = bnRuleName('one-route-method-per-file');

export const oneRouteMethodPerFile: CreateOnceRule = defineBellonaRule({
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
      extraRoute: agentDiagnostic({
        problem:
          'This routes leaf file (path contains `/routes/` and is not `index.*`) declares more than one Elysia route method (`.get` / `.post` / …).',
        why: 'Leaf files are one verb each so schemas, names, and tests stay 1:1 with a route.',
        fix: 'Move extra verbs into their own leaf files. Mount all of them from `routes/index.ts` with `.use` / `.as` only.',
        avoid: 'Do not chain `.get().post()` in one leaf. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
