import { noHooksInRouteLifecycleName } from '../../../../src/plugins/tanstack-router/rules/no-hooks-in-route-lifecycle.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, fileRouteCode, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const hookInLifecycle = error('hookInLifecycle');

runTanstackRouterRule(noHooksInRouteLifecycleName, {
  valid: [
    validWith(
      fileRouteCode(`
        beforeLoad: ({ context }) => { if (!context.user) throw redirect({ to: '/login' }) },
        loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery()),
        component: Posts,
      `),
      { filename: APP_FILENAME },
    ),
    validWith(fileRouteCode(`component: function Posts() { return useQuery(postsQuery()) }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`pendingComponent: function Pending() { return useState(0) }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`validateSearch: () => useMemo(() => ({}), [])`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRouteCode(`loaderDeps: () => useId()`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`loader: () => userName()`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`loader: () => used()`), { filename: APP_FILENAME }),
    validWith(fileRouteCode(`loader: () => useQuery(postsQuery())`), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(fileRouteCode(`loader: () => useQuery(postsQuery())`), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: () => { useNavigate() }`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: () => { useState(false) }`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => useQuery(postsQuery())`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => use(context)`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: { handler: () => useLoaderData({ from: '/posts' }) }`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => React.useEffect(() => {})`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`loader: () => Route.useLoaderData()`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: async () => { await useRouter() }`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode(
        `export const Route = createRoute({ getParentRoute: () => root, path: '/posts', loader: () => useQuery(q) })`,
        ['createRoute'],
      ),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRouteCode(`beforeLoad: () => { useNavigate(); useQuery(q) }`),
      errors: [hookInLifecycle, hookInLifecycle],
    }),
  ],
});
