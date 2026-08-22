import { noGetRouteApiName } from '../../../../src/plugins/tanstack-router/rules/no-get-route-api.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

runTanstackRouterRule(noGetRouteApiName, {
  valid: [
    validWith(routerCode('useLoaderData({ from: "/posts/$postId" })'), { filename: APP_FILENAME }),
    validWith(
      "import { useParams } from '@tanstack/react-router';\nuseParams({ from: '/posts' })",
      {
        filename: APP_FILENAME,
      },
    ),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: "import { getRouteApi } from '@tanstack/react-router';",
      errors: [error('getRouteApi')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: "import { getRouteApi } from '@tanstack/react-router';\nconst api = getRouteApi('/posts')",
      errors: [error('getRouteApi'), error('getRouteApi')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('const data = Route.useLoaderData()'),
      errors: [error('boundHook')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('routeApi.useParams()'),
      errors: [error('boundHook')],
    }),
  ],
});
