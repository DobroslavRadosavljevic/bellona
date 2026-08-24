import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  ELYSIA_LIFECYCLE_METHODS,
  ELYSIA_ROUTES_INDEX_ALLOWED_METHODS,
  getElysiaInstanceMethodName,
  isElysiaRouteMethodCall,
} from '../elysia.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipElysiaRoutesIndex,
} from '../options.ts';

/**
 * `routes/index.ts` is a mount table only: `new Elysia` + `.use` / `.as`.
 * No route verbs or lifecycle handlers.
 */
export const routesIndexMountOnlyName = bnRuleName('routes-index-mount-only');

export const routesIndexMountOnly: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaRoutesIndex(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (isElysiaRouteMethodCall(node)) {
          context.report({ messageId: 'routeMethod', node });
          return;
        }

        const method = getElysiaInstanceMethodName(node);
        if (!method) {
          return;
        }
        if (ELYSIA_ROUTES_INDEX_ALLOWED_METHODS.has(method)) {
          return;
        }
        if (ELYSIA_LIFECYCLE_METHODS.has(method)) {
          context.report({
            messageId: 'lifecycle',
            data: { method },
            node,
          });
          return;
        }
        context.report({
          messageId: 'disallowedMethod',
          data: { method },
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description: 'Keep routes/index.ts as an Elysia mount table (use/as only; no handlers)',
    },
    messages: {
      routeMethod:
        '`routes/index` may only mount plugins via `.use` / `.as`. Move route methods to leaf route files.',
      lifecycle:
        '`routes/index` may not register `.{{method}}()`. Put lifecycle handlers on leaf route files.',
      disallowedMethod:
        '`routes/index` may only call `.use` / `.as` on Elysia instances. Found `.{{method}}()`.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
