import { requireRouterHookFromName } from '../../../../src/plugins/tanstack-router/rules/require-router-hook-from.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const missingFrom = error('missingFrom');

runTanstackRouterRule(requireRouterHookFromName, {
  valid: [
    validWith(routerCode('useLoaderData({ from: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('useParams({ strict: false })'), { filename: APP_FILENAME }),
    validWith(routerCode('Route.useLoaderData()'), { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useLoaderData()'),
      errors: [missingFrom],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useNavigate()'),
      errors: [missingFrom],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useParams({ select: (params) => params.id })'),
      errors: [missingFrom],
    }),
  ],
});
