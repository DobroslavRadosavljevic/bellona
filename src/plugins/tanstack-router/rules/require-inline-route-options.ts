import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectRouterEdgeBindings,
  getAppliedRouteOptions,
  isInlineRouteOptions,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';

export const requireInlineRouteOptionsName = bnRuleName('require-inline-route-options');

export const requireInlineRouteOptions: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require an inline object literal for `createFileRoute` / `createRoute` / `createRootRoute` / `createLazy*` options',
    },
    messages: {
      inlineOptions: agentDiagnostic({
        problem:
          '`{{factoryName}}` is given a helper, variable, or spread instead of an inline route options object.',
        why: 'A shared helper hides `loader`, `component`, and the other route keys. The route file then does not show the page.',
        fix: 'Pass an object literal on this call: `createFileRoute("/posts")({ component: PostsPage })`. Put shared UI in the `component` value, not in place of the options object.',
        avoid:
          'Do not pass `legalRoute("…")` or `{ ...legalRoute("…") }`. Do not store options in a shared variable. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        bindings = collectRouterEdgeBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        const applied = getAppliedRouteOptions(node, bindings);
        if (applied === undefined || isInlineRouteOptions(applied.argument)) {
          return;
        }
        context.report({
          messageId: 'inlineOptions',
          node: applied.argument,
          data: { factoryName: applied.factoryName },
        });
      },
    };
  },
});
