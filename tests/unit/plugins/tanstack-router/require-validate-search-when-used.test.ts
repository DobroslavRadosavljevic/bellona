import { requireValidateSearchWhenUsedName } from '../../../../src/plugins/tanstack-router/rules/require-validate-search-when-used.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const missingValidateSearch = error('missingValidateSearch');

const fileRoute = (options: string, extra = ''): string =>
  routerCode(`export const Route = createFileRoute('/posts')({ ${options} })\n${extra}`, [
    'createFileRoute',
    'useSearch',
  ]);

runTanstackRouterRule(requireValidateSearchWhenUsedName, {
  valid: [
    validWith(
      fileRoute(`
        validateSearch: (input) => ({ q: String(input.q ?? '') }),
        loaderDeps: ({ search }) => ({ q: search.q }),
      `),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRoute(
        `validateSearch: (input) => ({ q: String(input.q ?? '') }), component: Posts`,
        'function Posts() { return useSearch({ from: "/posts" }) }',
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRoute(`loader: () => fetchPosts()`), { filename: APP_FILENAME }),
    validWith(fileRoute(`loaderDeps: ({ search }) => ({ q: search.q })`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(routerCode('useSearch({ from: "/posts" })', ['useSearch']), {
      filename: APP_FILENAME,
    }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loaderDeps: ({ search }) => ({ q: search.q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(
        `component: Posts`,
        'function Posts() { return useSearch({ from: "/posts" }) }',
      ),
      errors: [missingValidateSearch],
    }),
  ],
});
