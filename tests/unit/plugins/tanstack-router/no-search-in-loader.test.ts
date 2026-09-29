import { noSearchInLoaderName } from '../../../../src/plugins/tanstack-router/rules/no-search-in-loader.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const searchInLoader = error('searchInLoader');

runTanstackRouterRule(noSearchInLoaderName, {
  valid: [
    validWith(
      fileRouteCode(`
        validateSearch: (input) => ({ offset: Number(input.offset) }),
        loaderDeps: ({ search }) => ({ offset: search.offset }),
        loader: ({ deps }) => fetchPosts(deps.offset),
      `),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loader: { handler: ({ deps }) => fetchPosts(deps.offset) }`), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteCode(
        `beforeLoad: ({ search }) => ({ q: search.q }), loader: ({ context }) => context`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`component: function Posts() { return search }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loader: (opts) => fetchPosts(opts.deps)`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loader: ({ search }) => fetchPosts(search.offset)`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(fileRouteCode(`loader: ({ search }) => fetchPosts(search.offset)`), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('const search = 1; loader({ search })', { filename: APP_FILENAME }),
    // A `search` field that comes through `loaderDeps` is the documented input.
    validWith(
      fileRouteCode(`
        validateSearch: (input) => ({ search: String(input.search ?? '') }),
        loaderDeps: ({ search }) => ({ search: search.search }),
        loader: ({ deps }) => fetchPosts(deps.search),
      `),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteCode(`
        validateSearch: (input) => ({ search: String(input.search ?? '') }),
        loaderDeps: ({ search: { search } }) => ({ search }),
        loader: ({ deps: { search } }) => fetchPosts(search),
      `),
      { filename: APP_FILENAME },
    ),
    // Loader data can have its own `search` field.
    validWith(
      fileRouteCode(`loader: async () => (await fetchSaved()).map((item) => item.search)`),
      {
        filename: APP_FILENAME,
      },
    ),
    validWith(
      fileRouteCode(`loader: async () => (await fetchSaved()).map(({ search }) => search)`),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteCode(`loader: () => { const read = ({ search }) => search; return read({}) }`),
      {
        filename: APP_FILENAME,
      },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: ({ search }) => fetchPosts(search.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: (opts) => fetchPosts(opts.search.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: { handler: ({ search }) => fetchPosts(search.offset) }`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: ({ search: query }) => fetchPosts(query.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: async function load({ search }) { return search.offset }`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', loader: ({ search }) => search })`,
        ['createRoute'],
      ),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(
        `loader: { handler: (opts) => opts.search, staleReloadMode: 'blocking' }`,
      ),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: ({ location }) => fetchPosts(location.search.offset)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: (opts) => fetchPosts(opts.location.search)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: ({ location: { search } }) => fetchPosts(search)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => fetchPosts(window.location.search)`),
      errors: [searchInLoader],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: (opts) => fetchPosts(opts['search'])`),
      errors: [searchInLoader],
    }),
  ],
});
