import { RuleTester } from 'oxlint/plugins-dev';

import effect from '../../../../src/plugins/effect/index.ts';
import { runRule } from '../../lib/rule-tester.ts';

export function runEffectRule(
  name: keyof typeof effect.rules & string,
  tests: RuleTester.TestCases,
): void {
  runRule(effect, name, tests, 'ts');
}
