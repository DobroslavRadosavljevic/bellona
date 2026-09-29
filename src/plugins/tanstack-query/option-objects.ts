import type { Context, ESTree } from '@oxlint/plugins';

import { objectProperty, resolveValue } from './ast.ts';
import {
  clientMethod,
  importedName,
  CLIENT_FETCH_METHODS,
  FILTER_METHODS,
  QUERY_OPTIONS,
  MUTATION_OPTIONS,
  resultKind,
} from './evidence.ts';

export type OptionKind =
  | 'query'
  | 'mutation'
  | 'client'
  | 'dehydrate'
  | 'filters'
  | 'page'
  | 'refetch'
  | 'observer';
export interface OptionObject {
  node: ESTree.Node;
  kind: OptionKind;
}

function defaults(context: Context, node: ESTree.Node | undefined): OptionObject[] {
  const result: OptionObject[] = [];
  for (const [name, kind] of [
    ['queries', 'query'],
    ['mutations', 'mutation'],
    ['dehydrate', 'dehydrate'],
  ] as const) {
    const property = objectProperty(context.sourceCode, node, name);
    if (property !== undefined) result.push({ node: property.value, kind });
  }
  return result;
}

export function optionObjects(
  context: Context,
  node: ESTree.CallExpression | ESTree.NewExpression,
): OptionObject[] {
  const source = context.sourceCode;
  const name = importedName(source, node.callee);
  const first = node.arguments[0];
  const second = node.arguments[1];
  if (first === undefined) return [];
  if (name !== undefined && QUERY_OPTIONS.has(name)) return [{ node: first, kind: 'query' }];
  if (name !== undefined && MUTATION_OPTIONS.has(name)) return [{ node: first, kind: 'mutation' }];
  if (name === 'QueryObserver' || name === 'InfiniteQueryObserver')
    return second === undefined ? [] : [{ node: second, kind: 'observer' }];
  if (name === 'MutationObserver')
    return second === undefined ? [] : [{ node: second, kind: 'mutation' }];
  if (name === 'QueryClient')
    return [
      { node: first, kind: 'client' },
      ...defaults(context, objectProperty(source, first, 'defaultOptions')?.value),
    ];
  if (name === 'dehydrate')
    return second === undefined ? [] : [{ node: second, kind: 'dehydrate' }];
  if (name === 'useQueries' || name === 'useSuspenseQueries') {
    const queries = resolveValue(source, objectProperty(source, first, 'queries')?.value);
    return queries?.type === 'ArrayExpression'
      ? queries.elements.flatMap((element) =>
          element == null ? [] : [{ node: element, kind: 'query' } satisfies OptionObject],
        )
      : [];
  }
  const method = clientMethod(context, node.callee);
  if (method !== undefined && CLIENT_FETCH_METHODS.has(method))
    return [{ node: first, kind: 'query' }];
  if (method !== undefined && FILTER_METHODS.has(method))
    return node.arguments
      .slice(
        0,
        ['resetQueries', 'cancelQueries', 'invalidateQueries', 'refetchQueries'].includes(method)
          ? 2
          : 1,
      )
      .map((argument) => ({ node: argument, kind: 'filters' }));
  if (method === 'setDefaultOptions') return defaults(context, first);
  if (method === 'setQueryDefaults' || method === 'setMutationDefaults')
    return second === undefined
      ? []
      : [{ node: second, kind: method === 'setQueryDefaults' ? 'query' : 'mutation' }];
  const callee = resolveValue(source, node.callee);
  if (callee?.type === 'MemberExpression' && resultKind(source, callee.object) === 'query') {
    const key = callee.computed
      ? callee.property.type === 'Literal'
        ? callee.property.value
        : undefined
      : callee.property.type === 'Identifier'
        ? callee.property.name
        : undefined;
    if (key === 'fetchNextPage' || key === 'fetchPreviousPage')
      return [{ node: first, kind: 'page' }];
    if (key === 'refetch') return [{ node: first, kind: 'refetch' }];
  }
  return [];
}
