import { requireInlineRouteOptionsName } from '../../../../src/plugins/tanstack-router/rules/require-inline-route-options.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode, routerCodeFrom } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const inlineOptions = error('inlineOptions');

runTanstackRouterRule(requireInlineRouteOptionsName, {
  valid: [
    validWith(fileRouteCode(`component: PostsPage`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`component: PostsPage, loader: async () => getPost()`), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCode(`export const Route = createFileRoute('/posts')(({ component: PostsPage }))`, [
        'createFileRoute',
      ]),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ component: PostsPage } as const)`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ component: PostsPage } satisfies RouteOptions)`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/{-$locale}/accessibility/')({ component: AccessibilityPage })`,
        ['createFileRoute'],
      ),
      { filename: 'src/routes/{-$locale}/accessibility/index.tsx' },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ component: legalPage('posts') })`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(
        `export const Route = createFileRoute('/posts')({ ...base, component: PostsPage })`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(`export const Route = createFileRoute('/posts')({})`, ['createFileRoute']),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode(`export const Route = createFileRoute('/posts')`, ['createFileRoute']), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', component: PostsPage })`,
        ['createRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(`export const Route = createRootRoute({ component: Root })`, ['createRootRoute']),
      { filename: 'src/routes/__root.tsx' },
    ),
    validWith(
      routerCode(`export const Route = createRootRouteWithContext()({ component: Root })`, [
        'createRootRouteWithContext',
      ]),
      { filename: 'src/routes/__root.tsx' },
    ),
    validWith(
      routerCode(
        `export const Route = createRootRouteWithContext<AppContext>()({ component: Root })`,
        ['createRootRouteWithContext'],
      ),
      { filename: 'src/routes/__root.tsx' },
    ),
    validWith(
      routerCode(`export const Route = createLazyFileRoute('/posts')({ component: PostsPage })`, [
        'createLazyFileRoute',
      ]),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(`export const Route = createLazyRoute('/posts')({ component: PostsPage })`, [
        'createLazyRoute',
      ]),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ component: PostsPage })`,
        ['createFileRoute'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      `import { createFileRoute as cfr } from '@tanstack/react-router';\nexport const Route = cfr('/posts')({ component: PostsPage })`,
      { filename: APP_FILENAME },
    ),
    validWith(
      `import * as Router from '@tanstack/react-router';\nexport const Route = Router.createFileRoute('/posts')({ component: PostsPage })`,
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCode(`export const Route = createFileRoute('/posts')(legalRoute('posts'))`, [
        'createFileRoute',
      ]),
      { filename: 'src/posts.test.tsx' },
    ),
    validWith(
      routerCode(`export const Route = createFileRoute('/posts')(legalRoute('posts'))`, [
        'createFileRoute',
      ]),
      { filename: APP_FILENAME, options: [{ allow: ['posts.tsx'] }] },
    ),
    validWith(`export const Route = createFileRoute('/posts')(legalRoute('posts'))`, {
      filename: APP_FILENAME,
    }),
    validWith(routerCode(`export const page = legalRoute('posts')`, ['createFileRoute']), {
      filename: APP_FILENAME,
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'src/routes/{-$locale}/accessibility/index.tsx',
      code: routerCode(
        `export const Route = createFileRoute('/{-$locale}/accessibility/')(legalRoute('accessibility'))`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createFileRoute('/posts')(legalRoute('posts'))`, [
        'createFileRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createFileRoute('/posts')(sharedOptions)`, [
        'createFileRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createFileRoute('/posts')(getOptions())`, [
        'createFileRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createFileRoute('/posts')(legalRoute('posts') as const)`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createFileRoute('/posts')({ ...legalRoute('posts') })`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createFileRoute('/posts')({ ...base, ...legalRoute('posts') })`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createRoute(legalRoute('posts'))`, ['createRoute']),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: 'src/routes/__root.tsx',
      code: routerCode(`export const Route = createRootRoute(legalRoute('root'))`, [
        'createRootRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: 'src/routes/__root.tsx',
      code: routerCode(`export const Route = createRootRouteWithContext()(legalRoute('root'))`, [
        'createRootRouteWithContext',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createLazyFileRoute('/posts')(legalRoute('posts'))`, [
        'createLazyFileRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createLazyRoute('/posts')(legalRoute('posts'))`, [
        'createLazyRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { createFileRoute as cfr } from '@tanstack/react-router';\nexport const Route = cfr('/posts')(legalRoute('posts'))`,
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nexport const Route = Router.createFileRoute('/posts')(legalRoute('posts'))`,
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')(legalRoute('posts'))`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createFileRoute('/posts')(cond ? optionsA : optionsB)`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Posts = createFileRoute('/posts')(legalRoute('posts'));\nexport const About = createFileRoute('/about')(legalRoute('about'))`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions, inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createFileRoute('/posts')(...routeOptions)`, [
        'createFileRoute',
      ]),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createFileRoute('/posts')(await legalRoute('posts'))`,
        ['createFileRoute'],
      ),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(`export const Route = createRootRoute(sharedRoot)`, ['createRootRoute']),
      errors: [inlineOptions],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRootRouteWithContext<AppContext>()(legalRoute('root'))`,
        ['createRootRouteWithContext'],
      ),
      errors: [inlineOptions],
    }),
  ],
});
