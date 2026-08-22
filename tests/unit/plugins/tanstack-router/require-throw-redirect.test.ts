import { requireThrowRedirectName } from '../../../../src/plugins/tanstack-router/rules/require-throw-redirect.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const throwRedirect = error('throwRedirect');

runTanstackRouterRule(requireThrowRedirectName, {
  valid: [
    validWith(routerCode('throw redirect({ to: "/login" })', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('throw Route.redirect({ to: "../login" })', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('throw (redirect({ to: "/login" }))', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('redirect({ to: "/login" })', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('return redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
  ],
});
