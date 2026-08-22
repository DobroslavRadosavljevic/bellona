import { noRelativeRouterToWithoutFromName } from '../../../../src/plugins/tanstack-router/rules/no-relative-router-to-without-from.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const missingFrom = error('missingFrom');

runTanstackRouterRule(noRelativeRouterToWithoutFromName, {
  valid: [
    validWith(routerCode('<Link to="/posts" />'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link to=".." from={Route.fullPath} />'), { filename: APP_FILENAME }),
    validWith(
      routerCode('const navigate = useNavigate({ from: "/posts" }); navigate({ to: ".." })'),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode('const navigate = Route.useNavigate(); navigate({ to: "." })'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('navigate({ to: "..", from: "/posts" })'), { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link to=".." />'),
      errors: [missingFrom],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('navigate({ to: "." })'),
      errors: [missingFrom],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('redirect({ to: "posts" })'),
      errors: [missingFrom],
    }),
  ],
});
