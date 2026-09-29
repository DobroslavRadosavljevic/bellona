import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

const methods = [
  'fetchQuery',
  'fetchInfiniteQuery',
  'prefetchQuery',
  'prefetchInfiniteQuery',
  'ensureQueryData',
  'ensureInfiniteQueryData',
];
runQueryRule('no-deprecated-client-methods', {
  valid: [
    {
      code: queryCode('const { queryClient: client } = context; client.prefetchQuery(options);'),
      options: [{ queryClientNames: [] }],
    },

    queryCode(
      'const client = new QueryClient(); client.query(options); client.infiniteQuery(options).catch(noop);',
    ),
    'queryClient.prefetchInfiniteQuery(options);',
    queryCode('const unrelated = { fetchQuery() {} }; unrelated.fetchQuery();'),
    queryCode('const queryClient = { fetchQuery() {} }; queryClient.fetchQuery();'),
    queryCode('const c = new QueryClient(); function example(c) { c.fetchQuery(); }'),
    queryCode('const c = new QueryClient(); c[method](options);'),
    queryCode('function example(QueryClient) { const c = new QueryClient(); c.fetchQuery(); }'),
    queryCode('let c = new QueryClient(); c = other; c.fetchQuery();'),
    {
      code: queryCode('queryClient.fetchQuery(options);'),
      filename: '/src/legacy/file.ts',
      options: [{ allow: ['/legacy/'] }],
    },
    {
      code: queryCode('context.queryClient.fetchQuery(options);'),
      options: [{ queryClientNames: [] }],
    },
  ],
  invalid: [
    {
      code: queryCode(
        'const { queryClient: client } = context; client.prefetchInfiniteQuery(options);',
      ),
      errors: [{ messageId: 'deprecated' }],
    },

    ...methods.map((method) => ({
      code: queryCode(`const client = new QueryClient(); client.${method}(options);`),
      errors: [{ messageId: 'deprecated' }],
    })),
    {
      code: queryCode('const c = useQueryClient(); const alias = c; alias.prefetchQuery(options);'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import { QueryClient as Client } from "@tanstack/query-core"; new Client().fetchQuery(options);',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import * as Q from "@tanstack/react-query"; const c = new Q.QueryClient(); c["fetchQuery"](options);',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('const c = useQueryClient(); c?.[`prefetchInfiniteQuery`]?.(options);'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('const c = new QueryClient(); const fn = c.prefetchQuery;'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('const c = new QueryClient(); const { fetchQuery: fetch } = c;'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('function load(c: QueryClient) { c.fetchQuery(options); }'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import { createFileRoute } from "@tanstack/react-router"; export const Route = createFileRoute("/")({ loader: ({ context }) => { void context.queryClient.prefetchInfiniteQuery(options); } });',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('function load({ queryClient }) { queryClient.ensureQueryData(options); }'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('context.cache.fetchQuery(options);'),
      options: [{ queryClientNames: ['cache'] }],
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('(useQueryClient()!).fetchQuery(options);'),
      filename: '/src/file.test.ts',
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});
