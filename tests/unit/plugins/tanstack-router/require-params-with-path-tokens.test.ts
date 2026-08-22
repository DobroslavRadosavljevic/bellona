import { requireParamsWithPathTokensName } from '../../../../src/plugins/tanstack-router/rules/require-params-with-path-tokens.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const missingParams = error('missingParams');

runTanstackRouterRule(requireParamsWithPathTokensName, {
  valid: [
    validWith(routerCode('<Link to="/posts/$postId" params={{ postId }} />'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('navigate({ to: "/posts/$postId", params: { postId } })'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('linkOptions({ to: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link to="/posts/$postId" />'), { filename: 'src/foo.test.tsx' }),
    validWith(routerCode('<Link to="/posts/$postId" />'), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('<Link to="/posts/$postId" />', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link to="/posts/$postId" />'),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('navigate({ to: "/posts/$postId" })'),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('redirect({ to: `/posts/$postId` })'),
      errors: [missingParams],
    }),
  ],
});
