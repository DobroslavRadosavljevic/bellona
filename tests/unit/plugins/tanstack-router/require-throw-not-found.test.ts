import { requireThrowNotFoundName } from '../../../../src/plugins/tanstack-router/rules/require-throw-not-found.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode, routerCodeFrom } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const throwNotFound = error('throwNotFound');

runTanstackRouterRule(requireThrowNotFoundName, {
  valid: [
    validWith(routerCode('throw notFound()', ['notFound']), { filename: APP_FILENAME }),
    validWith(routerCode('throw notFound({ routeId: "/posts" })', ['notFound']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('throw (notFound())', ['notFound']), { filename: APP_FILENAME }),
    validWith(routerCode('throw notFound() as never', ['notFound']), { filename: APP_FILENAME }),
    validWith(routerCode('notFound({ throw: true })', ['notFound']), { filename: APP_FILENAME }),
    validWith(routerCodeFrom('@tanstack/solid-router', 'throw notFound()', ['notFound']), {
      filename: APP_FILENAME,
    }),
    validWith(routerCode('notFound()', ['notFound']), { filename: 'src/foo.test.tsx' }),
    validWith(routerCode('notFound()', ['notFound']), { filename: 'src/routes/posts.spec.ts' }),
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
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('const err = notFound()', ['notFound']),
      errors: [throwNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('void notFound({ routeId: "/posts" })', ['notFound']),
      errors: [throwNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('if (!post) { return notFound() }', ['notFound']),
      errors: [throwNotFound],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCodeFrom('@tanstack/solid-start', 'notFound()', ['notFound']),
      errors: [throwNotFound],
    }),
  ],
});
