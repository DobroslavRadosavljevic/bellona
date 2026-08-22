import { noHooksInRouteLifecycleName } from '../../../../src/plugins/tanstack-router/rules/no-hooks-in-route-lifecycle.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const hookInLifecycle = error('hookInLifecycle');

const fileRoute = (options: string): string =>
  routerCode(`export const Route = createFileRoute('/posts')({ ${options} })`, ['createFileRoute']);

runTanstackRouterRule(noHooksInRouteLifecycleName, {
  valid: [
    validWith(
      fileRoute(`
        beforeLoad: ({ context }) => { if (!context.user) throw redirect({ to: '/login' }) },
        loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery()),
        component: Posts,
      `),
      { filename: APP_FILENAME },
    ),
    validWith(fileRoute(`component: function Posts() { return useQuery(postsQuery()) }`), {
      filename: APP_FILENAME,
    }),
    validWith(fileRoute(`loader: () => useQuery(postsQuery())`), { filename: 'src/foo.test.tsx' }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`beforeLoad: () => { useNavigate() }`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: () => useQuery(postsQuery())`),
      errors: [hookInLifecycle],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: fileRoute(`loader: { handler: () => useLoaderData({ from: '/posts' }) }`),
      errors: [hookInLifecycle],
    }),
  ],
});
