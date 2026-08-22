import { requireThrowRedirectName } from '../../../../src/plugins/tanstack-router/rules/require-throw-redirect.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode, routerCodeFrom } from './fixtures.ts';
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
    validWith(routerCode('return redirect({ to: "/login" })', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('redirect({ to: "/login", throw: true })', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('response.redirect("/login")', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('throw (redirect({ to: "/login" }))', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('throw redirect({ to: "/login" }) as never', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('if (!user) { throw redirect({ to: "/login" }) }', ['redirect']), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCodeFrom('@tanstack/solid-router', 'throw redirect({ to: "/login" })', ['redirect']),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: 'src/foo.spec.tsx',
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: 'src/__tests__/nav.tsx',
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith(routerCode('redirect({ to: "/login" })', ['redirect']), {
      filename: APP_FILENAME,
      options: [{ allow: ['routes/'] }],
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
      code: routerCode('void redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('const loc = redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('await redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('Route.redirect({ to: "../login" })', ['redirect']),
      errors: [throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('redirect({ to: "/a" }); redirect({ to: "/b" })', ['redirect']),
      errors: [throwRedirect, throwRedirect],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCodeFrom('@tanstack/react-start', 'redirect({ to: "/login" })', ['redirect']),
      errors: [throwRedirect],
    }),
  ],
});
