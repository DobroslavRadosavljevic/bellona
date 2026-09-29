import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

const unstable = [{ messageId: 'unstable' }];

runQueryRule('no-unstable-deps', {
  valid: [
    queryCode('const { data } = useQuery(options); useEffect(() => {}, [data]);'),
    queryCode('const { mutate } = useMutation(options); useCallback(() => mutate(), [mutate]);'),
    queryCode('const query = useQuery(options); useEffect(() => {}, [query.data]);'),
    queryCode('const value = compute(); useMemo(() => value, [value]);'),
    queryCode('const query = useQuery(options); useEffect(() => {});'),
    // `combine` output keeps its identity between renders.
    queryCode(
      'const data = useQueries({ queries, combine: (results) => results.map((r) => r.data) }); useMemo(() => data, [data]);',
    ),
    'const query = useQuery(options); useEffect(() => {}, [query]);',
    {
      code: queryCode('const query = useQuery(options); useEffect(() => {}, [query]);'),
      filename: '/src/legacy/list.tsx',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    {
      code: queryCode('const query = useQuery(options); useEffect(() => {}, [query]);'),
      errors: unstable,
    },
    {
      code: queryCode(
        'const mutation = useMutation(options); useCallback(() => mutation.mutate(), [mutation]);',
      ),
      errors: unstable,
    },
    {
      code: queryCode(
        'const results = useQueries({ queries }); React.useMemo(() => results, [results]);',
      ),
      errors: unstable,
    },
    {
      code: queryCode(
        'const list = useSuspenseInfiniteQuery(options); useLayoutEffect(() => {}, [list, other]);',
      ),
      errors: unstable,
    },
  ],
});
