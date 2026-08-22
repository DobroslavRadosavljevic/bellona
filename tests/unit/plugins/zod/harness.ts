import { RuleTester } from 'oxlint/plugins-dev';

import zod from '../../../../src/plugins/zod/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runZodRule(
  name: keyof typeof zod.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(zod, name, tests, 'ts');
}
