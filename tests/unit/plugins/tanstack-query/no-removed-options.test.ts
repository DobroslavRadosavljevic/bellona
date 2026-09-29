import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

const removed = [
  'cacheTime',
  'useErrorBoundary',
  'keepPreviousData',
  'isDataEqual',
  'onSuccess',
  'onError',
  'onSettled',
  'context',
  'suspense',
  'refetchPage',
];
runQueryRule('no-removed-options', {
  valid: [
    queryCode('const c = new QueryClient(); c.setQueriesData({}, { refetchPage: true });'),
    queryCode('const c = new QueryClient(); c.setQueryData([], { cacheTime: 1 });'),

    queryCode(
      'useQuery({ queryKey: [], gcTime: 1000, placeholderData: keepPreviousData, throwOnError: true });',
    ),
    queryCode('useMutation({ onSuccess() {}, onError() {}, onSettled() {} });'),
    queryCode('new QueryCache({ onError() {}, onSuccess() {}, onSettled() {} });'),
    queryCode('new QueryObserver(client, { suspense: true });'),
    queryCode(
      'useQuery({ queryKey: [], meta: { cacheTime: 1, onSuccess: true }, initialData: { keepPreviousData: true } });',
    ),
    queryCode(
      'useQuery({ queryKey: [], refetchInterval: query => query.state.data ? 100 : false });',
    ),
    queryCode('function test(useQuery) { useQuery({ cacheTime: 1 }); }'),
    queryCode('const object = { cacheTime: 1 }; other(object);'),
    queryCode('useQuery({ [key]: 1 });'),
    'useQuery({ cacheTime: 1 });',
    {
      code: queryCode('useQuery({ cacheTime: 1 });'),
      filename: '/src/legacy.ts',
      options: [{ allow: ['legacy.ts'] }],
    },
  ],
  invalid: [
    {
      code: 'import * as Q from "@tanstack/react-query"; const { useQuery: useRead } = Q; useRead({ cacheTime: 1 });',
      errors: [{ messageId: 'removed' }],
    },

    ...removed.map((name) => ({
      code: queryCode(`useQuery({ queryKey: [], ${name}: value });`),
      errors: [{ messageId: 'removed' }],
    })),
    {
      code: queryCode('const opts = { cacheTime: 100 }; const alias = opts; useQuery(alias);'),
      errors: [{ messageId: 'removed' }],
    },
    {
      code: queryCode(
        'const opts = { cacheTime: 100 }; queryOptions({ ...opts }); useQuery(opts);',
      ),
      errors: [{ messageId: 'removed' }],
    },
    {
      code: 'import { useQuery as read } from "@tanstack/react-query"; const useRead = read; useRead({ cacheTime: 1 });',
      errors: [{ messageId: 'removed' }],
    },
    {
      code: 'import * as Q from "@tanstack/react-query"; Q.useQuery({ ["cacheTime"]: 1 });',
      errors: [{ messageId: 'removed' }],
    },
    {
      code: queryCode('useMutation({ cacheTime: 1, useErrorBoundary: true, context: custom });'),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode(
        'new QueryClient({ logger, defaultOptions: { queries: { onSuccess() {} }, mutations: { cacheTime: 1 } } });',
      ),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode(
        'const client = new QueryClient(); client.setDefaultOptions({ queries: { cacheTime: 1 } }); client.setMutationDefaults([], { cacheTime: 2 });',
      ),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode(
        'useQueries({ queries: [{ queryKey: [], onSuccess() {} }, { queryKey: [], cacheTime: 1 }] });',
      ),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode('dehydrate(client, { dehydrateQueries: false, dehydrateMutations: true });'),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode(
        'const client = new QueryClient(); client.refetchQueries({}, { refetchPage() {} });',
      ),
      errors: [{ messageId: 'removed' }],
    },
    {
      code: queryCode(
        'const query = useInfiniteQuery(options); query.fetchNextPage({ pageParam: 3 }); query.refetch({ refetchPage() {} });',
      ),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode('useQuery({ refetchInterval: (data, query) => 100 });'),
      errors: [{ messageId: 'removed' }],
    },
    {
      code: queryCode(
        'const view = <QueryClientProvider client={client} contextSharing context={custom} />;',
      ),
      errors: [{ messageId: 'removed' }, { messageId: 'removed' }],
    },
    {
      code: queryCode('new QueryObserver(client, { onSuccess() {} });'),
      errors: [{ messageId: 'removed' }],
    },
    {
      code: queryCode('const opts = { ...opts, cacheTime: 1 }; useQuery(opts);'),
      errors: [{ messageId: 'removed' }],
    },
  ],
});
