import { createRoutePropertyOrderName } from '../../../../src/plugins/tanstack-router/rules/create-route-property-order.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const invalidOrder = error('invalidOrder');

const fileRoute = (options: string): string =>
  routerCode(`export const Route = createFileRoute('/posts')({ ${options} })`, ['createFileRoute']);

runTanstackRouterRule(createRoutePropertyOrderName, {
  valid: [
    validWith(
      fileRoute(`
        validateSearch: (input) => ({ q: String(input.q ?? '') }),
        loaderDeps: ({ search }) => ({ q: search.q }),
        beforeLoad: () => ({ hello: 'world' }),
        loader: ({ context }) => context.hello,
      `),
      { filename: APP_FILENAME },
    ),
    validWith(fileRoute(`loader: () => fetchPosts()`), { filename: APP_FILENAME }),
    validWith(fileRoute(`loader: () => fetchPosts(), beforeLoad: () => ({})`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(
      routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', beforeLoad: () => ({}), loader: () => 1 })`,
        ['createRoute'],
      ),
      { filename: APP_FILENAME },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: () => fetchPosts(), beforeLoad: () => ({ hello: 'world' })`),
      errors: [invalidOrder],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: () => fetchPosts(), validateSearch: (input) => input`),
      errors: [invalidOrder],
    }),
  ],
});
