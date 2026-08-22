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
    validWith(routerCode('<Link to="/posts/$postId" params={params} />'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('navigate({ to: "/posts/$postId", params: { postId } })'), {
      filename: APP_FILENAME,
    }),
    validWith(
      routerCode('navigate({ to: "/posts/$postId", params: (prev) => ({ ...prev, postId }) })'),
      { filename: APP_FILENAME },
    ),
    validWith(routerCode('linkOptions({ to: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link to="." />'), { filename: APP_FILENAME }),
    validWith(routerCode('<Navigate to="/posts" />'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link to="/posts/$postId" from="/posts/$postId" />'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('navigate({ from: "/posts/$postId", to: "/posts/$postId" })'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('buildLocation({ to: "/posts" })', ['buildLocation']), {
      filename: APP_FILENAME,
    }),
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
      code: routerCode('<Navigate to="/posts/$postId" />'),
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
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('linkOptions({ to: "/posts/$postId" })'),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('linkOptions([{ to: "/a/$id" }, { to: "/b/$id", params: { id } }])'),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('preloadRoute({ to: "/posts/$postId" })', ['preloadRoute']),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('buildLocation({ to: "../$postId" })', ['buildLocation']),
      errors: [missingParams],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<><Link to="/posts/$postId" /><Link to="/users/$userId" /></>'),
      errors: [missingParams, missingParams],
    }),
  ],
});
