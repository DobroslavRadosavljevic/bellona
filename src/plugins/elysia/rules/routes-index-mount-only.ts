import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
      routeMethod: agentDiagnostic({
        problem:
          '`routes/index` calls an Elysia route method (`.get` / `.post` / …). This file is a mount table only.',
        why: 'Index files that declare routes duplicate the leaf layout and hide the 1:1 file-per-verb rule.',
        fix: 'Move the route into a leaf file under `routes/` (not `index`). Here, only `.use(leafRoute)` / `.as(...)`.',
        avoid: 'Do not keep a “small” `.get` in the index. Do not disable the rule.',
      }),
      lifecycle: agentDiagnostic({
        problem: '`routes/index` registers `.{{method}}()`. Lifecycle belongs on leaf route files.',
        why: 'Index lifecycle runs for every mounted plugin and is hard to test in isolation.',
        fix: 'Move `.{{method}}()` to the leaf route plugin that owns that behavior. Keep the index as `.use` / `.as` only.',
        avoid: 'Do not wrap lifecycle in `.use((app) => …)` on the index. Do not disable the rule.',
      }),
      disallowedMethod: agentDiagnostic({
        problem:
          '`routes/index` called `.{{method}}()` on an Elysia instance. Only `.use` and `.as` are allowed here.',
        why: 'Any other method is routing or lifecycle, which belongs on a leaf.',
        fix: 'Remove `.{{method}}()` from the index. Put it on a leaf route file and `.use` that file.',
        avoid: 'Do not add a dummy `.use` wrapper around the call. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
