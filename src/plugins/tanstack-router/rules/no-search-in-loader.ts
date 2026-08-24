import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isSearchAccessInLoader } from '../route.ts';

export const noSearchInLoaderName = bnRuleName('tanstack-router', 'no-search-in-loader');

export const noSearchInLoader: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow reading `search` inside a TanStack Router `loader`',
    },
    messages: {
      searchInLoader:
        'Do not read `search` in `loader`. Declare `validateSearch`, map fields in `loaderDeps`, and read `deps` in the loader.',
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
      Identifier(node) {
        if (isSearchAccessInLoader(node)) {
          context.report({ messageId: 'searchInLoader', node });
        }
      },
      MemberExpression(node) {
        if (isSearchAccessInLoader(node)) {
          context.report({ messageId: 'searchInLoader', node });
        }
      },
    };
  },
});
