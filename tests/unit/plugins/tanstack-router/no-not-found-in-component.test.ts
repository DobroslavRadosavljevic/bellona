import { noNotFoundInComponentName } from '../../../../src/plugins/tanstack-router/rules/no-not-found-in-component.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import {
  APP_FILENAME,
  fileRouteWith,
  LIB_FILENAME,
  routerCode,
  routerCodeFrom,
  startServerFnCode,
} from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const notFoundInComponent = error('notFoundInComponent');

runTanstackRouterRule(noNotFoundInComponentName, {
  valid: [
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: async ({ params }) => { const post = await getPost(params.postId); if (!post) throw notFound(); return { post } }, component: PostPage`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `beforeLoad: ({ params }) => { if (!params.postId) throw notFound() }, component: PostPage`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: { handler: async () => { if (!post) throw notFound(); return { post } } }, component: PostPage`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: async () => { function check() { if (!post) throw notFound() }; check(); return { post } }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `beforeLoad: () => { const check = () => { if (!id) throw notFound() }; check() }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      startServerFnCode(
        `export const getPost = createServerFn().handler(async () => { if (!post) throw notFound(); return post })`,
      ),
      { filename: 'src/fn/get-post.ts' },
    ),
    validWith(
      startServerFnCode(
        `export const getPost = createServerFn().validator((data) => data).handler(async ({ data }) => { if (!data) throw notFound(); return data })`,
      ),
      { filename: 'src/fn/get-post.ts' },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: async ({ params }) => { const post = await getPost(params.postId); assertFound(post); return { post } }, component: PostPage`,
        `function assertFound(post: unknown) { if (!post) throw notFound() }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(['notFound'], `component: () => { if (!post) throw notFound(); return null }`),
      { filename: 'src/posts.test.tsx' },
    ),
    validWith(
      fileRouteWith(['notFound'], `component: () => { if (!post) throw notFound(); return null }`),
      { filename: APP_FILENAME, options: [{ allow: ['posts.tsx'] }] },
    ),
    validWith('throw notFound()', { filename: APP_FILENAME }),
    validWith(
      fileRouteWith(
        ['redirect'],
        `component: () => { throw redirect({ to: '/login' }); return null }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteWith(['notFound'], `head: () => { throw notFound(); return {} }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteWith(['notFound'], `onEnter: () => { throw notFound() }`), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ loader: () => { throw notFound() } })`,
        ['createFileRoute', 'notFound'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      `import { createFileRoute as cfr, notFound as missing } from '@tanstack/react-router';\nexport const Route = cfr('/posts')({ loader: () => { throw missing() } })`,
      { filename: APP_FILENAME },
    ),
    validWith(
      `import * as Router from '@tanstack/react-router';\nexport const Route = Router.createFileRoute('/posts')({ loader: () => { throw Router.notFound() } })`,
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `loader: () => { notFound({ throw: true }) }, component: PostPage`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode('export function getPost() { throw notFound() }', ['notFound']), {
      filename: LIB_FILENAME,
    }),
    validWith(
      startServerFnCode(
        `const fn = createServerFn();\nexport const getPost = fn.handler(async () => { throw notFound() })`,
      ),
      { filename: 'src/fn/get-post.ts' },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: () => { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: function PostPage() { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `pendingComponent: function Pending() { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `errorComponent: function ErrorPage() { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `notFoundComponent: () => { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: PostPage`,
        `function PostPage() { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: PostPage`,
        `const PostPage = () => { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: PostPage`,
        `const PostPage = function PostPage() { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: PostPage`,
        `function PostPage() { const check = () => { throw notFound() }; check(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: async function PostPage() { if (!post) throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: () => { notFound({ throw: true }); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ component: () => { throw notFound(); return null } })`,
        ['createFileRoute', 'notFound'],
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createLazyFileRoute('/posts')({ component: () => { throw notFound(); return null } })`,
        ['createLazyFileRoute', 'notFound'],
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: () => { throw notFound() }, pendingComponent: () => { throw notFound() }`,
      ),
      errors: [notFoundInComponent, notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: memo(PostPage)`,
        `function PostPage() { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: PostPage as never`,
        `function PostPage() { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['notFound'],
        `component: Posts`,
        `export default function Posts() { throw notFound(); return null }`,
      ),
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { createFileRoute as cfr, notFound as missing } from '@tanstack/react-router';\nexport const Route = cfr('/posts')({ component: () => { throw missing(); return null } })`,
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import * as Router from '@tanstack/react-router';\nexport const Route = Router.createFileRoute('/posts')({ component: () => { throw Router.notFound(); return null } })`,
      errors: [notFoundInComponent],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', component: () => { throw notFound(); return null } })`,
        ['createRoute', 'notFound'],
      ),
      errors: [notFoundInComponent],
    }),
  ],
});
