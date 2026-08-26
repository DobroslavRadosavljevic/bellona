import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  beforeLoadReadsSearch,
  getCallFromPath,
  getCreateRouteOptions,
  isNamedCall,
  loaderDepsReadsSearch,
  routeHasValidateSearch,
  type CreatedRoute,
} from '../route.ts';

export const requireValidateSearchWhenUsedName = bnRuleName('require-validate-search-when-used');

function isBoundUseSearch(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  if (getStaticPropertyName(callee.property) !== 'useSearch') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  return object?.type === 'Identifier' && object.name === 'Route';
}

function routeReadsSearchHere(
  route: CreatedRoute,
  useSearchFroms: readonly (string | undefined)[],
  boundUseSearch: boolean,
): boolean {
  if (loaderDepsReadsSearch(route.options) || beforeLoadReadsSearch(route.options)) {
    return true;
  }
  if (boundUseSearch) {
    return true;
  }
  return useSearchFroms.some((from) => from !== undefined && from === route.routePath);
}

export const requireValidateSearchWhenUsed: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `validateSearch` when this route reads search via `loaderDeps`, `beforeLoad`, or `useSearch`',
    },
    messages: {
      missingValidateSearch: agentDiagnostic({
        problem:
          'This route uses search params but has no `validateSearch`. Search is raw URL text until the route parses it.',
        why: 'Without `validateSearch`, `search` is untyped and unparsed. Loaders and components then guess.',
        fix: 'Add `validateSearch` (Zod / Effect Schema / a parse function) on this `createFileRoute` / `createRoute` options object. Then map fields through `loaderDeps` if the loader needs them.',
        avoid: 'Do not type-assert `search`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let routes: CreatedRoute[];
    let useSearchFroms: (string | undefined)[];
    let boundUseSearch: boolean;

    return {
      before() {
        routes = [];
        useSearchFroms = [];
        boundUseSearch = false;
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (isNamedCall(node, 'useSearch')) {
          if (isBoundUseSearch(node)) {
            boundUseSearch = true;
          } else {
            useSearchFroms.push(getCallFromPath(node));
          }
        }
        const created = getCreateRouteOptions(node);
        if (created !== undefined) {
          routes.push(created);
        }
      },
      after() {
        const onlyRoute = routes.length === 1 ? routes[0] : undefined;
        const hasUnscopedUseSearch = useSearchFroms.some((from) => from === undefined);
        for (const route of routes) {
          if (routeHasValidateSearch(route.options)) {
            continue;
          }
          const unscopedOnSoleRoute = onlyRoute === route && hasUnscopedUseSearch;
          if (unscopedOnSoleRoute || routeReadsSearchHere(route, useSearchFroms, boundUseSearch)) {
            context.report({ messageId: 'missingValidateSearch', node: route.options });
          }
        }
      },
    };
  },
});
