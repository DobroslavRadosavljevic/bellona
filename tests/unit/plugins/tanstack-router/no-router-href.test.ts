import { noRouterHrefName } from '../../../../src/plugins/tanstack-router/rules/no-router-href.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { APP_FILENAME, routerCode } from './fixtures.ts';
import { runTanstackRouterRule } from './harness.ts';

const routerHref = error('routerHref');

runTanstackRouterRule(noRouterHrefName, {
  valid: [
    validWith(routerCode('<Link to="/posts" />'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link href="https://example.com" />'), { filename: APP_FILENAME }),
    validWith(routerCode('<Link href="mailto:hi@example.com" />'), { filename: APP_FILENAME }),
    validWith(routerCode('navigate({ href: "https://example.com" })'), { filename: APP_FILENAME }),
  ],
  invalid: [
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link href="/posts" />'),
      errors: [routerHref],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('<Link href={href} />'),
      errors: [routerHref],
    }),
    invalidWith({
      filename: APP_FILENAME,
      code: routerCode('navigate({ href: "/posts" })'),
      errors: [routerHref],
    }),
  ],
});
