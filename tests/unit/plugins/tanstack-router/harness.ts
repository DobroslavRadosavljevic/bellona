import { RuleTester } from 'oxlint/plugins-dev';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runTanstackRouterRule(
  name: keyof typeof tanstackRouter.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(tanstackRouter, name, tests, 'tsx');
}
