import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

runQueryRule('no-deprecated-results', {
  valid: [
    queryCode(
      'const query = useQuery(options); query.isLoading; query.isPending; query.data.isInitialLoading;',
    ),
    queryCode('const mutation = useMutation(options); mutation.isPending;'),
    queryCode('const value = { isInitialLoading: true }; value.isInitialLoading;'),
    queryCode(
      'const query = useQuery(options); function check(query) { return query.isInitialLoading; }',
    ),
    queryCode('const query = useQuery(options); query[property]; query.status === "pending";'),
    'const query = useQuery(options); query.isInitialLoading;',
    {
      code: queryCode('useQuery(options).isInitialLoading;'),
      filename: '/legacy/file.ts',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    ...['isInitialLoading', 'isPreviousData', 'remove'].map((name) => ({
      code: queryCode(`const q = useQuery(options); q.${name};`),
      errors: [{ messageId: 'deprecated' }],
    })),
    ...['isInitialLoading', 'isPreviousData', 'remove'].map((name) => ({
      code: queryCode(`const { ${name}: alias } = useInfiniteQuery(options);`),
      errors: [{ messageId: 'deprecated' }],
    })),
    {
      code: queryCode('const q = useQuery(options); const alias = q; alias?.["isInitialLoading"];'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('const { isLoading } = useMutation(options);'),
      errors: [{ messageId: 'deprecated' }],
    },
    { code: queryCode('useMutation(options).isLoading;'), errors: [{ messageId: 'deprecated' }] },
    {
      code: queryCode(
        'const q = useQuery(options); q.status === "loading"; "loading" !== q.status;',
      ),
      errors: [{ messageId: 'deprecated' }, { messageId: 'deprecated' }],
    },
    {
      code: queryCode('const { status: state } = useMutation(options); state === "loading";'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: queryCode('const q = useQuery(options); switch (q.status) { case "loading": break; }'),
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});
