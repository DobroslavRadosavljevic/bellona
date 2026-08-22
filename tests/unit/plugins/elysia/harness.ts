import { RuleTester } from 'oxlint/plugins-dev';

import elysia from '../../../../src/plugins/elysia/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runElysiaRule(
  name: keyof typeof elysia.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(elysia, name, tests, 'ts');
}
