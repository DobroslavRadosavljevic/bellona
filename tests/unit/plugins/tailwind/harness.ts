import { RuleTester } from 'oxlint/plugins-dev';

import tailwind from '../../../../src/plugins/tailwind/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runTailwindRule(
  name: keyof typeof tailwind.rules & string,
  tests: RuleTester.TestCases,
  lang: 'ts' | 'tsx' = 'ts',
): void {
  runRule(tailwind, name, tests, lang);
}
