import { noWholeSearchLoaderDepsName } from '../../../../src/plugins/tanstack-router/rules/no-whole-search-loader-deps.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const wholeSearch = error('wholeSearch');

runTanstackRouterRule(noWholeSearchLoaderDepsName, {
  valid: [
    validWith(fileRouteCode(`loaderDeps: ({ search: { page, q } }) => ({ page, q })`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loaderDeps: ({ search }) => ({ page: search.page })`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loaderDeps: (ctx) => ({ page: ctx.search.page })`), {
      filename: APP_FILENAME,
    }),
    // A search param that is named `search` is one field, not the whole object.
    validWith(fileRouteCode(`loaderDeps: ({ search: { search } }) => ({ search })`), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteCode(
        `loaderDeps: ({ search }) => { const pick = (s) => s; return { page: search.page } }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loaderDeps: () => ({ version: 1 })`), { filename: APP_FILENAME }),
    validWith(routerCode(`const options = { loaderDeps: ({ search }) => search }`, ['Link']), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loaderDeps: ({ search }) => search`), {
      filename: 'src/routes/posts.test.tsx',
    }),
    validWith(fileRouteCode(`loaderDeps: ({ search }) => search`), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith(
      `export const Route = createFileRoute('/posts')({ loaderDeps: ({ search }) => search })`,
      {
        filename: APP_FILENAME,
      },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => search`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => ({ ...search })`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => ({ search })`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search: params }) => ({ ...params, extra: 1 })`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: (ctx) => ctx.search`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: function deps(ctx) { return { ...ctx['search'] } }`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => search as { page: number }`),
      errors: [wholeSearch],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', loaderDeps: ({ search }) => search })`,
        ['createRoute'],
      ),
      errors: [wholeSearch],
    }),
  ],
});
