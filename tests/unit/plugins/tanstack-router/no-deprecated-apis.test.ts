import { noDeprecatedApisName } from '../../../../src/plugins/tanstack-router/rules/no-deprecated-apis.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteWith, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const deprecated = error('deprecated');

/** The name keeps each case readable. RuleTester checks the message id. */
function deprecatedName(_name: string) {
  return deprecated;
}

const START_IMPORT = `import { createServerFn, createMiddleware } from '@tanstack/react-start';\n`;

runTanstackRouterRule(noDeprecatedApisName, {
  valid: [
    validWith(routerCode(`throw redirect({ to: '/login', statusCode: 301 })`, ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode(`throw notFound({ routeId: rootRouteId })`, ['notFound', 'rootRouteId']), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteWith(
        ['redirect'],
        `params: { parse: (raw) => raw, stringify: (params) => params }, search: { middlewares: [] }, beforeLoad: ({ context }) => { if (!context.user) throw redirect({ to: '/login' }) }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteWith([], `loader: ({ context }) => context.navigate('/x')`), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCode(
        `const Route = createRoute({ getParentRoute: () => root, path: '/' }); new Map()`,
        ['createRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    // A local class with a deprecated name is not the router class.
    validWith(routerCode(`class Route {} new Route()`, ['Link']), { filename: APP_FILENAME }),
    validWith(routerCode(`<Link to="/posts" viewTransition />`, ['Link']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode(`navigate({ to: '/posts', replace: true })`, ['useNavigate']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode(`useBlocker({ shouldBlockFn: () => dirty })`, ['useBlocker']), {
      filename: APP_FILENAME,
    }),
    validWith(
      `${START_IMPORT}export const fn = createServerFn().validator((data) => data).handler(() => 1)`,
      {
        filename: 'src/server/fn.ts',
      },
    ),
    validWith(
      `import { redirect } from '@tanstack/react-router';\nconst schema = z.object({}); schema.inputValidator(1)`,
      {
        filename: APP_FILENAME,
      },
    ),
    validWith(
      routerCode(`import type { ErrorComponentProps } from '@tanstack/react-router'`, ['Link']),
      {
        filename: APP_FILENAME,
      },
    ),
    validWith(routerCode(`throw redirect({ to: '/login', code: 301 })`, ['redirect']), {
      filename: 'src/routes/posts.test.tsx',
    }),
    validWith(routerCode(`throw redirect({ to: '/login', code: 301 })`, ['redirect']), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith(`throw redirect({ to: '/login', code: 301 })`, { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`throw redirect({ to: '/login', code: 301 })`, ['redirect']),
      errors: [deprecatedName('redirect({ code })')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        [],
        `beforeLoad: () => { throw Route.redirect({ to: '../login', code: 302 }) }`,
      ),
      errors: [deprecated],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`throw notFound({ global: true })`, ['notFound']),
      errors: [deprecatedName('notFound({ global })')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        [],
        `parseParams: (raw) => raw, stringifyParams: (params) => params, preSearchFilters: [], postSearchFilters: []`,
      ),
      errors: [
        deprecatedName('parseParams'),
        deprecatedName('stringifyParams'),
        deprecatedName('preSearchFilters'),
        deprecatedName('postSearchFilters'),
      ],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/$id', parseParams: (raw) => raw })`,
        ['createRoute'],
      ),
      errors: [deprecatedName('parseParams')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith([], `beforeLoad: ({ navigate }) => navigate({ to: '/login' })`),
      errors: [deprecatedName('navigate')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith([], `loader: (ctx) => ctx.navigate({ to: '/login' })`),
      errors: [deprecatedName('navigate')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        [],
        `loader: { handler: async ({ navigate }) => { await navigate({ to: '/' }) } }`,
      ),
      errors: [deprecatedName('navigate')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`<Link to="/posts" startTransition />`, ['Link']),
      errors: [deprecatedName('startTransition')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`router.navigate({ to: '/posts', startTransition: true })`, ['useRouter']),
      errors: [deprecatedName('startTransition')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`const api = new RouteApi({ id: '/posts' })`, ['RouteApi']),
      errors: [deprecatedName('new RouteApi()')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `const a = new Route({ getParentRoute: () => root, path: '/' }); const b = new RootRoute(); const c = new FileRoute('/posts')`,
        ['Route', 'RootRoute', 'FileRoute'],
      ),
      errors: [
        deprecatedName('new Route()'),
        deprecatedName('new RootRoute()'),
        deprecatedName('new FileRoute()'),
      ],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nconst api = new Router.RouteApi({ id: '/posts' })`,
      errors: [deprecatedName('new RouteApi()')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { rootRouteWithContext, FileRouteLoader, ScrollRestoration } from '@tanstack/react-router';\nimport type { ErrorRouteProps } from '@tanstack/react-router';`,
      errors: [
        deprecatedName('rootRouteWithContext'),
        deprecatedName('FileRouteLoader'),
        deprecatedName('ScrollRestoration'),
        deprecatedName('ErrorRouteProps'),
      ],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `useBlocker(() => confirm('Leave?'), dirty); useBlocker({ blockerFn: () => true, condition: dirty })`,
        ['useBlocker'],
      ),
      errors: [deprecated, deprecated],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`<Block blockerFn={() => true} />`, ['Block']),
      errors: [deprecatedName('<Block blockerFn>')],
    }),
    invalidWith({
      filename: 'src/server/fn.ts',
      code: `${START_IMPORT}export const fn = createServerFn({ method: 'POST' }).inputValidator((data) => data).handler(() => 1)`,
      errors: [deprecatedName('.inputValidator()')],
    }),
    invalidWith({
      filename: 'src/server/fn.ts',
      code: `${START_IMPORT}const base = createMiddleware({ type: 'function' });\nexport const mw = base.inputValidator((data) => data).server(({ next }) => next())`,
      errors: [deprecatedName('.inputValidator()')],
    }),
  ],
});
