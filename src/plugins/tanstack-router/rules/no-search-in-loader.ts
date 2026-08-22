import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isSearchIdentifierInLoader } from '../route.ts';

export const noSearchInLoaderName = vmRuleName('no-search-in-loader');

export const noSearchInLoader: CreateOnceRule = defineVamanaRule({
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
        if (isSearchIdentifierInLoader(node)) {
          context.report({ messageId: 'searchInLoader', node });
        }
      },
    };
  },
});
