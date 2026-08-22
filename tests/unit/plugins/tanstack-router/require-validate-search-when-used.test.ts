import { requireValidateSearchWhenUsedName } from '../../../../src/plugins/tanstack-router/rules/require-validate-search-when-used.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const missingValidateSearch = error('missingValidateSearch');

runTanstackRouterRule(requireValidateSearchWhenUsedName, {
  valid: [
    validWith(
      fileRouteCode(`
        validateSearch: (input) => ({ q: String(input.q ?? '') }),
        loaderDeps: ({ search }) => ({ q: search.q }),
      `),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteCode(
        `validateSearch: (input) => ({ q: String(input.q ?? '') }), component: Posts`,
        'function Posts() { return useSearch({ from: "/posts" }) }',
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loader: () => fetchPosts()`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`loaderDeps: ({ context }) => ({ user: context.user })`), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteCode(
        `component: Posts`,
        'function Posts() { return useSearch({ from: "/other" }) }',
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loaderDeps: ({ search } = { search: {} }) => ({ q: search.q })`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(routerCode('useSearch({ from: "/posts" })', ['useSearch']), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loaderDeps: ({ search }) => ({ q: search.q })`), {
      filename: APP_FILENAME,
      options: [{ allow: ['routes/posts'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => ({ q: search.q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: (opts) => ({ q: opts.search.q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: ({ search }) => ({ q: search.q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search: q }) => ({ q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search } = { search: {} }) => ({ q: search.q })`),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(
        `component: Posts`,
        'function Posts() { return useSearch({ from: "/posts" }) }',
      ),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `function Posts() { return useSearch({ from: "/posts" }) }\nexport const Route = createFileRoute('/posts')({ component: Posts })`,
        ['createFileRoute', 'useSearch'],
      ),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', loaderDeps: ({ search }) => search })`,
        ['createRoute'],
      ),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRootRouteWithContext<{ q: string }>()({ loaderDeps: ({ search }) => search })`,
        ['createRootRouteWithContext'],
      ),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`component: Posts`, 'function Posts() { return Route.useSearch() }'),
      errors: [missingValidateSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const PostsRoute = createFileRoute('/posts')({ component: PostList })\nexport const IndexRoute = createFileRoute('/')({ component: Home })\nfunction PostList() { return useSearch({ from: "/posts" }) }`,
        ['createFileRoute', 'useSearch'],
      ),
      errors: [missingValidateSearch],
    }),
  ],
});
