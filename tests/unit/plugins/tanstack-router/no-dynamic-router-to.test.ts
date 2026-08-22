import { noDynamicRouterToName } from '../../../../src/plugins/tanstack-router/rules/no-dynamic-router-to.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const dynamicTo = error('dynamicTo');

runTanstackRouterRule(noDynamicRouterToName, {
  valid: [
    validWith(routerCode('<Link to="/posts/$postId" params={{ postId }} />'), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('navigate({ to: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('redirect({ to: `/posts` })'), { filename: APP_FILENAME }),
    validWith(routerCode('linkOptions({ to: "/posts" })'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link to={path} />'), {
      filename: 'src/foo.test.tsx',
    }),
    validWith(routerCode('<Link to={path} />'), {
      filename: APP_FILENAME,
      options: [{ allow: ['posts.tsx'] }],
    }),
    validWith('<Link to={path} />', { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link to={path} />'),
      errors: [dynamicTo],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link to={`/posts/${id}`} />'),
      errors: [dynamicTo],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('navigate({ to: "/posts/" + id })'),
      errors: [dynamicTo],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('linkOptions([{ to: path }])'),
      errors: [dynamicTo],
    }),
  ],
});
