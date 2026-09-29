import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

runQueryRule('no-deprecated-query-context', {
  valid: [
    queryCode('useInfiniteQuery({ queryFn: ({ pageParam }) => pageParam.direction });'),
    queryCode(
      'useQuery({ queryFn: ctx => { function inner(ctx) { return ctx.direction; } return inner(other); } });',
    ),
    queryCode('useMutation({ mutationFn: ({ direction }) => direction });'),
    queryCode('const object = { queryFn: ({ direction }) => direction };'),
    'useQuery({ queryFn: ({ direction }) => direction });',
    {
      code: queryCode('useQuery({ queryFn: ({ direction }) => direction });'),
      filename: '/legacy.ts',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    {
      code: queryCode(
        'function fetchData(ctx) { return ctx.direction; } useQuery({ queryFn: fetchData });',
      ),
      errors: [{ messageId: 'direction' }],
    },

    {
      code: queryCode('useInfiniteQuery({ queryFn: ({ direction }) => fetchPage(direction) });'),
      errors: [{ messageId: 'direction' }],
    },
    {
      code: queryCode('useQuery({ queryFn: ctx => ctx.direction });'),
      errors: [{ messageId: 'direction' }],
    },
    {
      code: queryCode('const fn = ctx => ctx["direction"]; queryOptions({ queryFn: fn });'),
      errors: [{ messageId: 'direction' }],
    },
    {
      code: queryCode(
        'const fn = ctx => { const { direction: dir } = ctx; return dir; }; useQuery({ queryFn: fn });',
      ),
      errors: [{ messageId: 'direction' }],
    },
    {
      code: queryCode('useQuery({ queryFn: ({ direction: dir = "forward" }) => dir });'),
      errors: [{ messageId: 'direction' }],
    },
  ],
});
