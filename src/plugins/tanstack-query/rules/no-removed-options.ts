import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { objectProperties, propertyName, resolveValue } from '../ast.ts';
import { importedName } from '../evidence.ts';
import { optionObjects, type OptionKind } from '../option-objects.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

function replacement(name: string, kind: OptionKind): string | undefined {
  if ((kind === 'query' || kind === 'mutation' || kind === 'observer') && name === 'cacheTime')
    return 'gcTime';
  if (
    (kind === 'query' || kind === 'mutation' || kind === 'observer') &&
    name === 'useErrorBoundary'
  )
    return 'throwOnError';
  if ((kind === 'query' || kind === 'mutation') && name === 'context')
    return 'the second hook argument for a custom QueryClient';
  if (kind === 'query' || kind === 'observer') {
    if (['onSuccess', 'onError', 'onSettled'].includes(name))
      return 'derived state or QueryCache callbacks; mutation callbacks remain valid';
    if (name === 'isDataEqual') return 'structuralSharing with a comparison function';
    if (name === 'keepPreviousData')
      return 'placeholderData: keepPreviousData; review status and dataUpdatedAt behavior';
    if (name === 'refetchPage')
      return 'maxPages after reviewing page retention and refetch behavior';
    if (name === 'suspense' && kind === 'query')
      return 'useSuspenseQuery, useSuspenseInfiniteQuery, or useSuspenseQueries';
  }
  if (kind === 'client' && name === 'logger')
    return 'the standard logger; custom QueryClient loggers were removed';
  if (kind === 'dehydrate' && name === 'dehydrateQueries') return 'shouldDehydrateQuery';
  if (kind === 'dehydrate' && name === 'dehydrateMutations') return 'shouldDehydrateMutation';
  if ((kind === 'filters' || kind === 'refetch') && name === 'refetchPage')
    return 'maxPages on the infinite query after reviewing page retention';
  if (kind === 'page' && name === 'pageParam')
    return 'getNextPageParam or getPreviousPageParam on the infinite query';
  return undefined;
}

export const noRemovedOptionsName = bnRuleName('no-removed-options');
export const noRemovedOptions: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow removed query, mutation, client, hydration, and pagination options',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      removed: agentDiagnostic({
        problem: '`{{name}}` is no longer supported here.',
        why: 'Current TanStack Query ignores or rejects this old option.',
        fix: 'Use {{replacement}}.',
        avoid: 'Do not rename unrelated data fields or remove valid mutation and cache callbacks.',
      }),
    },
  },
  createOnce(context) {
    let reported: Set<ESTree.Node>;
    function report(node: ESTree.Node, name: string, change: string): void {
      if (reported.has(node)) return;
      reported.add(node);
      context.report({ node, messageId: 'removed', data: { name, replacement: change } });
    }
    function check(node: ESTree.CallExpression | ESTree.NewExpression): void {
      for (const options of optionObjects(context, node)) {
        for (const property of objectProperties(context.sourceCode, options.node)) {
          const name = propertyName(property.key, property.computed);
          if (name === undefined) continue;
          const change = replacement(name, options.kind);
          if (change !== undefined) report(property.key, name, change);
          if (
            name === 'refetchInterval' &&
            (options.kind === 'query' || options.kind === 'observer')
          ) {
            const value = resolveValue(context.sourceCode, property.value);
            if (
              (value?.type === 'ArrowFunctionExpression' || value?.type === 'FunctionExpression') &&
              value.params.length > 1
            )
              report(property.key, name, 'one query argument; read data from query.state.data');
          }
        }
      }
    }
    return {
      before() {
        reported = new Set();
        if (skipFile(context)) return false;
      },
      CallExpression: check,
      NewExpression: check,
      JSXOpeningElement(node) {
        if (importedName(context.sourceCode, node.name) !== 'QueryClientProvider') return;
        for (const attribute of node.attributes) {
          if (
            attribute.type === 'JSXAttribute' &&
            attribute.name.type === 'JSXIdentifier' &&
            ['contextSharing', 'context'].includes(attribute.name.name)
          )
            report(
              attribute.name,
              attribute.name.name,
              'a shared QueryClient instance passed through the client prop',
            );
        }
      },
    };
  },
});
