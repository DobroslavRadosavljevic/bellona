import { RuleTester } from 'oxlint/plugins-dev';

import react from '../../../../src/plugins/react/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runReactRule(
  name: keyof typeof react.rules & string,
  tests: RuleTester.TestCases,
  lang: 'tsx' | 'ts' = 'tsx',
): void {
  runRule(react, name, tests, lang);
}
