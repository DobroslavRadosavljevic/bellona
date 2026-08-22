import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  getCreateRouteOptions,
  isNamedCall,
  loaderDepsReadsSearch,
  routeHasValidateSearch,
} from '../route.ts';

export const requireValidateSearchWhenUsedName = vmRuleName('require-validate-search-when-used');

export const requireValidateSearchWhenUsed: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `validateSearch` when a route file uses `useSearch` or `loaderDeps` reads `search`',
    },
    messages: {
      missingValidateSearch:
        'Add `validateSearch` on this route. Search params are raw URL text until the route parses them.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let sawUseSearch: boolean;
    let routeOptions: ESTree.ObjectExpression[];

    return {
      before() {
        sawUseSearch = false;
        routeOptions = [];
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (isNamedCall(node, 'useSearch')) {
          sawUseSearch = true;
        }
        const created = getCreateRouteOptions(node);
        if (created !== undefined) {
          routeOptions.push(created.options);
        }
      },
      after() {
        for (const options of routeOptions) {
          if (routeHasValidateSearch(options)) {
            continue;
          }
          if (sawUseSearch || loaderDepsReadsSearch(options)) {
            context.report({ messageId: 'missingValidateSearch', node: options });
          }
        }
      },
    };
  },
});
