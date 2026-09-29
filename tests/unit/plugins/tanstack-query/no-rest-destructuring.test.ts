import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

const rest = [{ messageId: 'rest' }];

runQueryRule('no-rest-destructuring', {
  valid: [
    queryCode('const { data, isPending } = useQuery(options);'),
    queryCode('const query = useQuery(options); const { data } = query;'),
    queryCode('const { mutate, ...mutation } = useMutation(options);'),
    queryCode('const { data: { items, ...meta } } = useQuery(options);'),
    queryCode('const results = useQueries({ queries }); results.map(({ data }) => data);'),
    queryCode('const { a, ...others } = someObject;'),
    'const { data, ...rest } = useQuery(options);',
    {
      code: queryCode('const { data, ...rest } = useQuery(options);'),
      filename: '/src/legacy/list.tsx',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    { code: queryCode('const { data, ...rest } = useQuery(options);'), errors: rest },
    { code: queryCode('const { data, ...rest } = useSuspenseQuery(options);'), errors: rest },
    { code: queryCode('const { ...all } = useInfiniteQuery(options);'), errors: rest },
    {
      code: queryCode('const { data, ...rest } = useSuspenseInfiniteQuery(options);'),
      errors: rest,
    },
    {
      code: queryCode('const query = useQuery(options); const { data, ...rest } = query;'),
      errors: rest,
    },
    {
      code: queryCode('const [{ data, ...rest }, second] = useQueries({ queries });'),
      errors: rest,
    },
    {
      code: queryCode('useSuspenseQueries({ queries }).map(({ data, ...rest }) => rest);'),
      errors: rest,
    },
  ],
});
