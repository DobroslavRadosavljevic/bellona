# TanStack Query rules

These nine opt-in rules target `@tanstack/react-query` and `@tanstack/query-core` **5.103.2**.
Research checked the current official docs and the published package source on 2026-09-23.
They cover current deprecations, common code removed in v5, and four checks from the official `@tanstack/eslint-plugin-query`.

Older v5 releases do not all provide `query`, `infiniteQuery`, or the new option types.
Update TanStack Query before you enable the rules that require those APIs.
The plugin does not read the consumer's installed version.

## Enable the rules

```ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: ['bellona/tanstack-query'],
  rules: {
    'bl-tanstack-query/exhaustive-deps': 'error',
    'bl-tanstack-query/no-deprecated-client-methods': 'error',
    'bl-tanstack-query/no-deprecated-imports': 'error',
    'bl-tanstack-query/no-deprecated-query-context': 'error',
    'bl-tanstack-query/no-deprecated-results': 'error',
    'bl-tanstack-query/no-removed-options': 'error',
    'bl-tanstack-query/no-rest-destructuring': 'error',
    'bl-tanstack-query/no-unstable-deps': 'error',
    'bl-tanstack-query/stable-query-client': 'error',
  },
});
```

Loading the plugin enables no rules. Tests and stories are checked too.
No rule applies automatic fixes. Several migrations change runtime behavior.

## Deprecated client methods

`no-deprecated-client-methods` reports calls, method references, and variable destructuring.

| Old method                         | Current method                                       | Behavior to review                                                               |
| ---------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `fetchQuery(options)`              | `query(options)`                                     | The new method applies `select`.                                                 |
| `fetchInfiniteQuery(options)`      | `infiniteQuery(options)`                             | The new method applies `select`.                                                 |
| `prefetchQuery(options)`           | `query(options).catch(noop)`                         | The new method returns data and can reject.                                      |
| `prefetchInfiniteQuery(options)`   | `infiniteQuery(options).catch(noop)`                 | The new method returns data and can reject.                                      |
| `ensureQueryData(options)`         | `query({ ...options, staleTime: 'static' })`         | Review `revalidateIfStale`; the replacement does not start a background refresh. |
| `ensureInfiniteQueryData(options)` | `infiniteQuery({ ...options, staleTime: 'static' })` | Review `revalidateIfStale`; the replacement does not start a background refresh. |

For the route-loader pattern:

```ts
import { noop } from '@tanstack/react-query';

void context.queryClient
  .infiniteQuery(chatHistoryQueryOptions(context.workspace.id, 'active', ''))
  .catch(noop);
```

`void` alone does not handle a rejected promise.
`.catch(noop)` preserves the old error suppression, but success still resolves with data.
If a caller needs `Promise<void>`, review that contract and discard the success value explicitly.

## Removed exports and deprecated types

`no-deprecated-imports` checks named imports, direct re-exports, namespace members, namespace destructuring, and namespace type references.
It also reports the deprecated helpers `isCancelledError` and `isServer`.

| Old export                       | Current API                                           |
| -------------------------------- | ----------------------------------------------------- |
| `Hydrate`                        | `HydrationBoundary`; it hydrates queries only.        |
| `useHydrate`                     | `HydrationBoundary`; review hydration timing.         |
| `hashQueryKey`                   | `hashKey`                                             |
| `FetchQueryOptions`              | `QueryExecuteOptions`                                 |
| `EnsureQueryDataOptions`         | `QueryExecuteOptions`; review cache behavior.         |
| `FetchInfiniteQueryOptions`      | `InfiniteQueryExecuteOptions`                         |
| `EnsureInfiniteQueryDataOptions` | `InfiniteQueryExecuteOptions`; review cache behavior. |
| `isCancelledError`               | `error instanceof CancelledError`                     |
| `isServer`                       | `environmentManager.isServer()`                       |

Generic type arguments are not interchangeable in every case. Check them during migration.

## Removed options

`no-removed-options` checks hook options, option helpers, observer constructors, and QueryClient defaults.
It follows local option variables and object spreads. It also checks literal `useQueries` lists.

| Old option or shape                                                | Current API                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `cacheTime`                                                        | `gcTime`                                                          |
| `useErrorBoundary`                                                 | `throwOnError`                                                    |
| Query `onSuccess`, `onError`, `onSettled`                          | Derived state or `QueryCache` callbacks, based on intent          |
| `isDataEqual`                                                      | A `structuralSharing` function                                    |
| `keepPreviousData` option                                          | `placeholderData: keepPreviousData`; review status and timestamps |
| Hook `context`                                                     | A custom QueryClient in the second hook argument                  |
| React query `suspense` option                                      | Dedicated suspense hooks                                          |
| QueryClient `logger`                                               | Remove the custom logger                                          |
| `refetchPage`                                                      | Review `maxPages`; it also changes page retention                 |
| `dehydrateQueries`, `dehydrateMutations`                           | `shouldDehydrateQuery`, `shouldDehydrateMutation`                 |
| `fetchNextPage({ pageParam })`, `fetchPreviousPage({ pageParam })` | Page selection callbacks                                          |
| Two-argument `refetchInterval` callback                            | One query argument; read `query.state.data`                       |
| Provider `contextSharing`, `context` JSX props                     | Share a QueryClient through `client`                              |

Mutation callbacks and `QueryCache` callbacks remain valid.
The `keepPreviousData` function remains valid.
Nested user data and `meta` fields are not treated as Query options.
Core `QueryObserver` still accepts its `suspense` option.

## Result and query context changes

`no-deprecated-results` checks direct hook results, local aliases, result destructuring, and status comparisons or switch cases.

| Old result                           | Current API                               |
| ------------------------------------ | ----------------------------------------- |
| Query `isInitialLoading`             | `isLoading`                               |
| Query `isPreviousData`               | `isPlaceholderData`                       |
| Query `remove`                       | `queryClient.removeQueries({ queryKey })` |
| Mutation `isLoading`                 | `isPending`                               |
| Query or mutation status `'loading'` | `'pending'`                               |

Query `isLoading` is still valid. It means the first fetch is in progress.

`no-deprecated-query-context` reports `direction` read from a recognized `queryFn` context.
It checks the first parameter's destructuring and direct member access, including local function declarations.
Put direction inside `pageParam` when the query needs it.

## React usage checks

These rules follow the official `@tanstack/eslint-plugin-query` rules with the same names.

`exhaustive-deps` requires each value that `queryFn` reads from its enclosing function scope in an inline array `queryKey`.
It skips imports, module-level values, functions, classes, called objects such as `api.get(id)`, and the QueryClient.
A local variable in the key covers the values in its initializer.
A `queryKey` that is not an inline array is not checked.

`no-rest-destructuring` rejects `...rest` when you destructure a `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, or `useSuspenseInfiniteQuery` result.
It also checks items of `useQueries` and `useSuspenseQueries`, in array patterns and in `.map()` callbacks.
A rest element reads every result field and turns off tracked properties.

`no-unstable-deps` rejects a whole query, infinite query, `useQueries`, or `useMutation` result in the dependency list of `useEffect`, `useLayoutEffect`, `useMemo`, or `useCallback`.
The result object is new on each render. List the fields you use.
A `useQueries` result with `combine` is skipped, because Query keeps its identity.

`stable-query-client` rejects `new QueryClient()` in the body of a component or hook.
Use `useState(() => new QueryClient())` or a module-level client.
A client inside a `useState`, `useRef`, or `useMemo` initializer is valid. An async server component is skipped.

## Options and detection limits

All rules accept `allow`, a list of path substrings to skip. Path separators are normalized.
Client-aware rules also use `queryClientNames`, which defaults to `['queryClient']`.
The shared schema accepts this option for every rule; other rules ignore it.

```ts
'bl-tanstack-query/no-deprecated-client-methods': ['error', {
  allow: ['/generated/'],
  queryClientNames: ['queryClient', 'serverCache'],
}],
```

The rules use lexical scope to follow imports, namespace imports, local aliases, `new QueryClient()`, and `useQueryClient()`.
Direct imported `QueryClient` type annotations also identify clients.
Local functions with the same names as imported hooks do not produce reports.

The client-name convention also finds `context.queryClient` in files that import `@tanstack/react-router`.
Set `queryClientNames: []` to require constructor, hook, or direct type evidence instead.
A matching member name is a convention, not proof of its runtime type.

Files without a supported Query import or re-export are skipped.
Client methods also accept a React Router import for route loaders.

These rules do not run the TypeScript type checker.
They do not follow imports across files, arbitrary wrappers, reassigned aliases, dynamic property names, or arbitrary callback data flow.
Result checks do not infer items returned by `useQueries`, custom hooks, or observer methods.
Option checks do not inspect arbitrary object mutations, JSX prop spreads, or options returned by unknown functions.
Context checks do not follow arbitrary aliases of the query function's first parameter.
Other framework adapters and persistence packages are outside this first plugin scope.
Runtime-only changes, such as focus events and server retry defaults, need application tests.

## Sources

- [Official v5 migration guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- [Official prefetching guide](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [Published QueryClient source, 5.103.2](https://unpkg.com/@tanstack/query-core@5.103.2/src/queryClient.ts)
- [Published core types, 5.103.2](https://unpkg.com/@tanstack/query-core@5.103.2/src/types.ts)
