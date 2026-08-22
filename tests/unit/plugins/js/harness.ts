import { RuleTester } from 'oxlint/plugins-dev';

import js from '../../../../src/plugins/js/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runJsRule(name: keyof typeof js.rules & string, tests: RuleTester.TestCases): void {
  runRule(js, name, tests);
}
