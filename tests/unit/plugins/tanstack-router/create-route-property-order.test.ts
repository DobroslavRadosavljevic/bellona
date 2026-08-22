import { createRoutePropertyOrderName } from '../../../../src/plugins/tanstack-router/rules/create-route-property-order.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const invalidOrder = error('invalidOrder');

runTanstackRouterRule(createRoutePropertyOrderName, {
  valid: [
    validWith(
      fileRouteCode(`
        validateSearch: (input) => ({ q: String(input.q ?? '') }),
        loaderDeps: ({ search }) => ({ q: search.q }),
        beforeLoad: () => ({ hello: 'world' }),
        loader: ({ context }) => context.hello,
      `),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loader: () => fetchPosts()`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`component: Posts, pendingComponent: Pending`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loader: () => 1, onEnter: () => {}, head: () => ({})`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`params: {}, validateSearch: (i) => i, search: { middlewares: [] }`), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('const make = createFileRoute("/posts")', ['createFileRoute']), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', beforeLoad: () => ({}), loader: () => 1 })`,
        ['createRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createRootRoute({ beforeLoad: () => ({}), loader: () => 1 })`,
        ['createRootRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`loader: () => fetchPosts(), beforeLoad: () => ({})`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(fileRouteCode(`loader: () => fetchPosts(), beforeLoad: () => ({})`), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => fetchPosts(), beforeLoad: () => ({ hello: 'world' })`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => fetchPosts(), validateSearch: (input) => input`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loaderDeps: ({ search }) => search, validateSearch: (input) => input`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: () => ({}), context: () => ({})`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`onEnter: () => {}, loader: () => 1`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`ssr: true, search: { middlewares: [] }`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRootRoute({ loader: () => 1, beforeLoad: () => ({}) })`,
        ['createRootRoute'],
      ),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRootRouteWithContext<{ a: 1 }>()({ loader: () => 1, beforeLoad: () => ({}) })`,
        ['createRootRouteWithContext'],
      ),
      errors: [invalidOrder],
    }),
  ],
});
