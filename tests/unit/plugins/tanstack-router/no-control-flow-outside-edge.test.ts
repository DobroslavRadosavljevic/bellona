import { noControlFlowOutsideEdgeName } from '../../../../src/plugins/tanstack-router/rules/no-control-flow-outside-edge.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import {
  APP_FILENAME,
  COLOCATED_LIB_FILENAME,
  fileRouteWith,
  LIB_FILENAME,
  routerCode,
  routerCodeFrom,
  startServerFnCode,
} from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const notFound = error('notFound');
const redirect = error('redirect');

runTanstackRouterRule(noControlFlowOutsideEdgeName, {
  valid: [
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: async ({ params }) => { const post = await getPost(params.postId); if (!post) throw notFound(); return { post } }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['redirect'],
        `beforeLoad: ({ context }) => { if (!context.user) throw redirect({ to: '/login' }) }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', loader: () => { if (!post) throw notFound() } })`,
        ['createRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createRootRoute({ beforeLoad: () => { if (!ready) throw notFound() } })`,
        ['createRootRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `const createRoute = createRootRouteWithContext(); export const Route = createRoute({ loader: () => { throw notFound() } })`,
        ['createRootRouteWithContext', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `const createRoute = createRootRouteWithContext<AppContext>(); export const Route = createRoute({ loader: () => { throw notFound() } })`,
        ['createRootRouteWithContext', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createLazyFileRoute('/posts')({ component: () => { if (!post) throw notFound(); return null } })`,
        ['createLazyFileRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createLazyRoute('/posts')({ component: Posts }); function go() { throw redirect({ to: '/login' }) }`,
        ['createLazyRoute', 'redirect'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: async ({ params }) => { const post = await getPost(params.postId); assertFound(post); return { post } }`,
        `function assertFound(post: unknown) { if (!post) throw notFound() }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      startServerFnCode(
        `export const getPost = createServerFn().handler(async () => { if (!post) throw notFound(); return post })`,
      ),
      {
        filename: 'src/fn/get-post.ts',
      },
    ),
    validWith(
      startServerFnCode(
        `export const requireAuth = createServerFn({ method: 'GET' }).validator((data) => data).handler(async () => { if (!user) throw redirect({ to: '/login' }); return user })`,
        ['redirect'],
      ),
      { filename: 'src/fn/auth.ts' },
    ),
    validWith(
      startServerFnCode(
        `const fn = createServerFn(); export const getPost = fn.handler(async () => { if (!post) throw notFound(); return post })`,
      ),
      { filename: 'src/fn/get-post.ts' },
    ),
    validWith(
      routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ loader: () => { throw notFound() } })`,
        ['createFileRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      `import { createServerFn } from '@tanstack/solid-start';\nimport { redirect } from '@tanstack/solid-router';\nexport const requireAuth = createServerFn().handler(async () => { throw redirect({ to: '/login' }) })`,
      { filename: 'src/fn/auth.ts' },
    ),
    validWith(
      fileRouteWith(['redirect'], `beforeLoad: () => { throw Route.redirect({ to: '../login' }) }`),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode('export function isMissing(error: unknown) { return isNotFound(error) }', [
        'isNotFound',
      ]),
      {
        filename: LIB_FILENAME,
      },
    ),
    validWith(
      routerCode('export function isGo(error: unknown) { return isRedirect(error) }', [
        'isRedirect',
      ]),
      {
        filename: LIB_FILENAME,
      },
    ),
    validWith(
      routerCode('export const dashboard = linkOptions({ to: "/dashboard" })', ['linkOptions']),
      {
        filename: LIB_FILENAME,
      },
    ),
    validWith(routerCode('export const Bound = CatchNotFound', ['CatchNotFound']), {
      filename: LIB_FILENAME,
    }),
    validWith(routerCode('export function go() { response.redirect("/login") }', ['redirect']), {
      filename: LIB_FILENAME,
    }),
    validWith(routerCode('throw notFound()', ['notFound']), { filename: 'src/foo.test.tsx' }),
    validWith(routerCode('throw notFound()', ['notFound']), {
      filename: 'src/posts.stories.tsx',
    }),
    validWith(routerCode('throw redirect({ to: "/login" })', ['redirect']), {
      filename: 'src/posts.spec.ts',
    }),
    validWith(routerCode('throw notFound()', ['notFound']), {
      filename: LIB_FILENAME,
      options: [{ allow: ['posts.ts'] }],
    }),
    validWith(routerCode('throw notFound()', ['notFound']), {
      filename: LIB_FILENAME,
      options: [{ allow: ['lib/'] }],
    }),
    validWith('throw notFound()', { filename: LIB_FILENAME }),
    validWith(
      `import { createFileRoute as cfr, notFound as missing } from '@tanstack/react-router';\nexport const Route = cfr('/posts')({ loader: () => { throw missing() } })`,
      { filename: APP_FILENAME },
    ),
    validWith(
      `import * as Router from '@tanstack/react-router';\nexport const Route = Router.createFileRoute('/posts')({ loader: () => { throw Router.notFound() } })`,
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteWith(['notFound'], `loader: () => { return notFound() }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteWith(['notFound'], `loader: () => { notFound({ throw: true }) }`), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: () => getPost()`,
        `export function getPost() { throw notFound() }`,
      ),
      { filename: COLOCATED_LIB_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ loader: () => { throw notFound() } }); export const Extra = createRoute({ path: '/extra', getParentRoute: () => root })`,
        ['createFileRoute', 'createRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      `import { createServerFn } from '@tanstack/react-start';\nimport { notFound } from '@tanstack/react-start';\nexport const getPost = createServerFn().handler(async () => { throw notFound() })`,
      { filename: 'src/fn/get-post.ts' },
    ),
  ],
  invalid: [
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function getPost() { throw notFound() }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function requireAuth() { throw redirect({ to: "/login" }) }', [
        'redirect',
      ]),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function requireAuth() { throw Route.redirect({ to: "/login" }) }', [
        'redirect',
      ]),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function requireAuth() { throw route.redirect({ to: "/login" }) }', [
        'redirect',
      ]),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function missing() { return notFound() }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function missing() { notFound({ throw: true }) }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function go() { redirect({ to: "/login", throw: true }) }', [
        'redirect',
      ]),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function missing() { throw notFound() }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('export function missing() { throw notFound() }', [
        'createFileRoute',
        'notFound',
      ]),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode(
        `const api = getRouteApi('/dashboard/settings');\nexport function checkAuth() { throw api.redirect({ to: '../login' }) }`,
        ['getRouteApi'],
      ),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode(
        `export function check() { throw getRouteApi('/posts').redirect({ to: '/login' }) }`,
        ['getRouteApi'],
      ),
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode(
        `export function go() { throw notFound(); throw redirect({ to: '/login' }) }`,
        ['notFound', 'redirect'],
      ),
      errors: [notFound, redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCodeFrom(
        '@tanstack/solid-router',
        'export function missing() { throw notFound() }',
        ['notFound'],
      ),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCodeFrom(
        '@tanstack/react-start',
        'export function missing() { throw notFound() }',
        ['notFound'],
      ),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: `import { createMiddleware } from '@tanstack/react-start';\nimport { notFound } from '@tanstack/react-router';\nexport const log = createMiddleware().server(() => { throw notFound() })`,
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode(
        `export const dashboard = linkOptions({ to: '/dashboard' }); export function missing() { throw notFound() }`,
        ['linkOptions', 'notFound'],
      ),
      errors: [notFound],
    }),
    invalidWith({
      filename: COLOCATED_LIB_FILENAME,
      code: routerCode('export function getPost() { throw notFound() }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nexport function missing() { throw Router.notFound() }`,
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: `import { notFound as missing } from '@tanstack/react-router';\nexport function getPost() { throw missing() }`,
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: `import { redirect as go } from '@tanstack/react-router';\nexport function requireAuth() { throw go({ to: '/login' }) }`,
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nexport function requireAuth() { throw Router.redirect({ to: '/login' }) }`,
      errors: [redirect],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode(
        `import { createServerFn } from '@tanstack/react-start';\nexport function missing() { throw notFound() }`,
        ['notFound'],
      ),
      errors: [notFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('export function getPost() { throw notFound() }', ['notFound']),
      errors: [notFound],
    }),
    invalidWith({
      filename: LIB_FILENAME,
      code: routerCode('throw notFound(); throw notFound()', ['notFound']),
      errors: [notFound, notFound],
    }),
  ],
});
