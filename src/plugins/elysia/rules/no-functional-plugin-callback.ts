import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  getUseCallReceiver,
  isEffectServiceUseReceiver,
  isElysiaInstanceExpression,
} from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Prefer `new Elysia()` plugin instances over `.use((app) => app…)` callbacks.
 * Gated to files that import `elysia`. Only reports when the `.use` receiver is
 * an Elysia instance (`new Elysia…` or a same-file binding thereof): not
 * unrelated helpers such as Effect `Service.use`.
 */
export const noFunctionalPluginCallbackName = bnRuleName('elysia', 'no-functional-plugin-callback');

export const noFunctionalPluginCallback: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const receiver = getUseCallReceiver(node);
        if (!receiver) {
          return;
        }
        // Defense in depth: never flag Effect Service.use / Context.Service.use
        if (isEffectServiceUseReceiver(receiver)) {
          return;
        }
        if (!isElysiaInstanceExpression(receiver)) {
          return;
        }

        const [first] = node.arguments;
        if (!first || first.type === 'SpreadElement') {
          return;
        }
        const expression = unwrapExpression(first);
        if (!isFunctionLike(expression)) {
          return;
        }
        // Official deferred plugins are async callbacks (`await app.modules`).
        if (expression.async) {
          return;
        }
        context.report({
          messageId: 'functionalPlugin',
          node: expression,
        });
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow functional .use((app) => …) plugins; prefer new Elysia() instances',
    },
    messages: {
      functionalPlugin:
        'Prefer `new Elysia({ name: "…" })` plugin instances over `.use((app) => …)` callbacks.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
