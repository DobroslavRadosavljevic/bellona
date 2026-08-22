import { noImperativeLocationNavigationName } from '../../../../src/plugins/tanstack-router/rules/no-imperative-location-navigation.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const imperative = error('imperative');

runTanstackRouterRule(noImperativeLocationNavigationName, {
  valid: [
    validWith(routerCode('navigate({ to: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('const href = location.href'), { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('location.href = "/posts"'),
      errors: [imperative],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('window.location.href = "/posts"'),
      errors: [imperative],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('window.location = "/posts"'),
      errors: [imperative],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('location.assign("/posts")'),
      errors: [imperative],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('history.pushState({}, "", "/posts")'),
      errors: [imperative],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('router.history.replace("/posts")'),
      errors: [imperative],
    }),
  ],
});
