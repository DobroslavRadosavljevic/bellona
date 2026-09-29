export function queryCode(code: string): string {
  return `import { QueryClient, QueryCache, QueryObserver, InfiniteQueryObserver, MutationObserver, useQueryClient, useQuery, useInfiniteQuery, useSuspenseQuery, useSuspenseInfiniteQuery, useMutation, useQueries, useSuspenseQueries, queryOptions, infiniteQueryOptions, mutationOptions, usePrefetchQuery, usePrefetchInfiniteQuery, useIsFetching, useIsMutating, dehydrate, keepPreviousData, QueryClientProvider } from '@tanstack/react-query';\n${code}`;
}
