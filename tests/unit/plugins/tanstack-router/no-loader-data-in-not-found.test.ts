import { noLoaderDataInNotFoundName } from '../../../../src/plugins/tanstack-router/rules/no-loader-data-in-not-found.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteWith, routerCode, routerCodeFrom } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const loaderDataInNotFound = error('loaderDataInNotFound');

runTanstackRouterRule(noLoaderDataInNotFoundName, {
  valid: [
    validWith(
      fileRouteWith(
        ['useParams'],
        `notFoundComponent: () => { const { postId } = useParams({ from: '/posts/$postId' }); return <p>{postId}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useSearch'],
        `notFoundComponent: () => { const search = useSearch({ from: '/posts' }); return <p>{search.page}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useRouteContext'],
        `notFoundComponent: () => { const context = useRouteContext({ from: '/posts' }); return <p>{context.user}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['notFound'],
        `notFoundComponent: ({ data }) => { return <p>{String(data)}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `component: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `pendingComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `errorComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteWith(['useLoaderData'], `loader: () => useLoaderData({ from: '/posts' })`), {
      filename: APP_FILENAME,
    }),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      { filename: 'src/posts.test.tsx' },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      { filename: APP_FILENAME, options: [{ allow: ['posts.tsx'] }] },
    ),
    validWith('useLoaderData({ from: "/posts" })', { filename: APP_FILENAME }),
    validWith(
      fileRouteWith(
        ['useParams'],
        `notFoundComponent: NotFound`,
        `function NotFound() { const { postId } = useParams({ from: '/posts/$postId' }); return <p>{postId}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData', 'useParams'],
        `component: Page, notFoundComponent: NotFound`,
        `function Page() { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }\nfunction NotFound() { const { postId } = useParams({ from: '/posts/$postId' }); return <p>{postId}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderDeps'],
        `notFoundComponent: () => { const deps = useLoaderDeps({ from: '/posts' }); return <p>{deps.page}</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ notFoundComponent: () => { const { postId } = useParams({ from: '/posts/$postId' }); return <p>{postId}</p> } })`,
        ['createFileRoute', 'useParams'],
      ),
      { filename: APP_FILENAME },
    ),
    validWith(
      fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: NotFound`,
        `function Other() { return useLoaderData({ from: '/posts' }) }\nfunction NotFound() { return <p>missing</p> }`,
      ),
      { filename: APP_FILENAME },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = Route.useLoaderData(); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = routeApi.useLoaderData(); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['getRouteApi'],
        `notFoundComponent: () => { const data = getRouteApi('/posts').useLoaderData(); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: NotFound`,
        `function NotFound() { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: NotFound`,
        `const NotFound = () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: NotFound`,
        `function NotFound() { const read = () => useLoaderData({ from: '/posts' }); return <p>{read().title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const data = useLoaderData(); return <p>{data}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCodeFrom(
        '@tanstack/solid-router',
        `export const Route = createFileRoute('/posts')({ notFoundComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> } })`,
        ['createFileRoute', 'useLoaderData'],
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: () => { const a = useLoaderData({ from: '/posts' }); const b = Route.useLoaderData(); return <p>{a.title}{b.title}</p> }`,
      ),
      errors: [loaderDataInNotFound, loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createLazyFileRoute('/posts')({ notFoundComponent: () => { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> } })`,
        ['createLazyFileRoute', 'useLoaderData'],
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: `import { createFileRoute, useLoaderData as useData } from '@tanstack/react-router';\nexport const Route = createFileRoute('/posts')({ notFoundComponent: () => { const data = useData({ from: '/posts' }); return <p>{data.title}</p> } })`,
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: memo(NotFound)`,
        `function NotFound() { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteWith(
        ['useLoaderData'],
        `notFoundComponent: NotFound as never`,
        `function NotFound() { const data = useLoaderData({ from: '/posts' }); return <p>{data.title}</p> }`,
      ),
      errors: [loaderDataInNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRootRoute({ notFoundComponent: () => { const data = useLoaderData({ from: '__root__' }); return <p>{data}</p> } })`,
        ['createRootRoute', 'useLoaderData'],
      ),
      errors: [loaderDataInNotFound],
    }),
  ],
});
