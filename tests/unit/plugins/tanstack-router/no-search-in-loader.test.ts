import { noSearchInLoaderName } from '../../../../src/plugins/tanstack-router/rules/no-search-in-loader.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const searchInLoader = error('searchInLoader');

const fileRoute = (options: string): string =>
  routerCode(`export const Route = createFileRoute('/posts')({ ${options} })`, ['createFileRoute']);

runTanstackRouterRule(noSearchInLoaderName, {
  valid: [
    validWith(
      fileRoute(`
        validateSearch: (input) => ({ offset: Number(input.offset) }),
        loaderDeps: ({ search }) => ({ offset: search.offset }),
        loader: ({ deps }) => fetchPosts(deps.offset),
      `),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRoute(`
        loader: { handler: ({ deps }) => fetchPosts(deps.offset) },
      `),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRoute(`
        loader: ({ search }) => fetchPosts(search.offset),
      `),
      { filename: 'src/foo.test.tsx' },
    ),
    validWith('const search = 1; loader({ search })', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: ({ search }) => fetchPosts(search.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: (opts) => fetchPosts(opts.search.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: { handler: ({ search }) => fetchPosts(search.offset) }`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: ({ search: query }) => fetchPosts(query.offset)`),
      errors: [searchInLoader],
    }),
  ],
});
