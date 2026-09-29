import { requireRouterHookFromName } from '../../../../src/plugins/tanstack-router/rules/require-router-hook-from.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const navigateMissingFrom = error('navigateMissingFrom');

runTanstackRouterRule(requireRouterHookFromName, {
  valid: [
    validWith(routerCode('useNavigate({ from: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('useNavigate({ from: Route.fullPath })'), { filename: APP_FILENAME }),
    validWith(routerCode('Route.useNavigate()'), { filename: APP_FILENAME }),
    // TypeScript `StrictOrFrom` already checks these hooks.
    validWith(routerCode('useLoaderData()'), { filename: APP_FILENAME }),
    validWith(routerCode('useParams({ select: (params) => params.id })'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('useNavigate()'), { filename: 'src/routes/posts.test.tsx' }),
    validWith(routerCode('useNavigate()'), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('useNavigate()', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useNavigate()'),
      errors: [navigateMissingFrom],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useNavigate({})'),
      errors: [navigateMissingFrom],
    }),
    // `useNavigate` has no `strict` option. Only `from` sets its origin route.
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useNavigate({ strict: false })'),
      errors: [navigateMissingFrom],
    }),
  ],
});
