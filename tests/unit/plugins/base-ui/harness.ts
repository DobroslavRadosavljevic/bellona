import { RuleTester } from 'oxlint/plugins-dev';

import baseUi from '../../../../src/plugins/base-ui/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runBaseUiRule(
  name: keyof typeof baseUi.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(baseUi, name, tests, 'tsx');
}
