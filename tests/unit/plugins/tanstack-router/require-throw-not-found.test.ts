import { requireThrowNotFoundName } from '../../../../src/plugins/tanstack-router/rules/require-throw-not-found.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const throwNotFound = error('throwNotFound');

runTanstackRouterRule(requireThrowNotFoundName, {
  valid: [
    validWith(routerCode('throw notFound()', ['notFound']), { filename: APP_FILENAME }),
    validWith(routerCode('throw notFound({ routeId: "/posts" })', ['notFound']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('notFound()', ['notFound']), { filename: 'src/foo.test.tsx' }),
    validWith(routerCode('notFound()', ['notFound']), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('notFound()', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('notFound()', ['notFound']),
      errors: [throwNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('return notFound()', ['notFound']),
      errors: [throwNotFound],
    }),
  ],
});
