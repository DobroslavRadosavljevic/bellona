import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isSearchAccessInLoader } from '../route.ts';

export const noSearchInLoaderName = bnRuleName('no-search-in-loader');

export const noSearchInLoader: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow reading `search` inside a TanStack Router `loader`',
    },
    messages: {
      searchInLoader: agentDiagnostic({
        problem:
          'This `loader` reads `search` directly. Search params are not the loader’s input unless you declare them on `loaderDeps`.',
        why: 'Loader cache keys come from `loaderDeps`. Reading raw `search` inside `loader` skips validation and breaks dependency tracking.',
        fix: 'Add `validateSearch` on the route. Map the needed fields in `loaderDeps: ({ search }) => ({ … })`. Read `deps` in the loader, not `search`.',
        avoid: 'Do not assert `search as T` in the loader. Do not disable the rule.',
      }),
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
