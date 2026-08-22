import { noRouterTypeAssertionName } from '../../../../src/plugins/tanstack-router/rules/no-router-type-assertion.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

runTanstackRouterRule(noRouterTypeAssertionName, {
  valid: [
    validWith(routerCode('<Link to="/posts" from="/layout" />'), { filename: APP_FILENAME }),
    validWith(routerCode('const data = useLoaderData({ from: "/posts" })'), {
      filename: APP_FILENAME,
    }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link to={path as "/posts"} />'),
      errors: [error('assertedToFrom')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('navigate({ to: path as "/posts" })'),
      errors: [error('assertedToFrom')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('const data = useLoaderData({ from: "/posts" }) as Posts'),
      errors: [error('assertedHook')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('const data: Posts = useLoaderData({ from: "/posts" })'),
      errors: [error('assertedHook')],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('useSearch<{ page: number }>({ from: "/posts" })'),
      errors: [error('assertedHook')],
    }),
  ],
});
