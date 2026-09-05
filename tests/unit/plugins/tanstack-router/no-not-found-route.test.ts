import { noNotFoundRouteName } from '../../../../src/plugins/tanstack-router/rules/no-not-found-route.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, LIB_FILENAME, routerCode, routerCodeFrom } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const notFoundRoute = error('notFoundRoute');

runTanstackRouterRule(noNotFoundRouteName, {
  valid: [
    validWith(
      routerCode(
        `export const Route = createRootRoute({ component: () => <Outlet />, notFoundComponent: () => <p>missing</p> })`,
        ['createRootRoute', 'Outlet'],
      ),
      { filename: 'src/routes/__root.tsx' },
    ),
    validWith(
      routerCode(
        `export const router = createRouter({ routeTree, defaultNotFoundComponent: () => <p>missing</p> })`,
        ['createRouter'],
      ),
      { filename: 'src/router.tsx' },
    ),
    validWith(routerCode(`export const router = createRouter({ routeTree })`, ['createRouter']), {
      filename: 'src/router.tsx',
    }),
    validWith(`import { NotFoundRoute } from '@tanstack/react-router';\nconst unused = 1`, {
      filename: 'src/legacy.test.tsx',
    }),
    validWith(`import { NotFoundRoute } from '@tanstack/react-router';\nconst unused = 1`, {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('const route = NotFoundRoute({ path: "/404" })', { filename: APP_FILENAME }),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ loader: () => { throw notFound() } })`,
        ['createFileRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode('export const notFoundRoute = 1', ['createRouter']), {
      filename: LIB_FILENAME,
    }),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ notFoundComponent: () => <p>missing</p> })`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCodeFrom(
        '@tanstack/solid-router',
        `export const router = createRouter({ routeTree, defaultNotFoundComponent: () => <p>missing</p> })`,
        ['createRouter'],
      ),
      { filename: 'src/router.tsx' },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/react-router';`,
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute as NFR } from '@tanstack/react-router';`,
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/react-router';\nconst route = NotFoundRoute({ path: '/404' })`,
      errors: [notFoundRoute, notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/react-router';\nconst route = new NotFoundRoute({ path: '/404' })`,
      errors: [notFoundRoute, notFoundRoute],
    }),
    invalidWith({
      filename: 'src/router.tsx',
      code: routerCode(`export const router = createRouter({ routeTree, notFoundRoute: legacy })`, [
        'createRouter',
      ]),
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: 'src/router.tsx',
      code: routerCode(`export const router = createRouter({ routeTree, notFoundRoute })`, [
        'createRouter',
      ]),
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/solid-router';`,
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/react-start';`,
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: 'src/router.tsx',
      code: routerCode(
        `export const router = createRouter({ routeTree, ['notFoundRoute']: legacy })`,
        ['createRouter'],
      ),
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nconst route = Router.NotFoundRoute({ path: '/404' })`,
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute as NFR } from '@tanstack/react-router';\nconst route = NFR({ path: '/404' })`,
      errors: [notFoundRoute, notFoundRoute],
    }),
    invalidWith({
      filename: 'src/router.tsx',
      code: routerCode(
        `const options = { notFoundRoute: legacy }; export const router = createRouter(options)`,
        ['createRouter'],
      ),
      errors: [notFoundRoute],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { NotFoundRoute } from '@tanstack/react-router';\nconst route = new NotFoundRoute({ path: '/404' });\nexport const router = createRouter({ routeTree, notFoundRoute: route })`,
      errors: [notFoundRoute, notFoundRoute, notFoundRoute],
    }),
  ],
});
