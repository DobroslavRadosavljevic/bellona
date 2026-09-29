import type { RuleTester } from 'oxlint/plugins-dev';

import tanstackQuery from '../../../../src/plugins/tanstack-query/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runQueryRule(
  name: keyof typeof tanstackQuery.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(tanstackQuery, name, tests, 'tsx');
}
