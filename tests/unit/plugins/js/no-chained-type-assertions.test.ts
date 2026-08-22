import { noChainedTypeAssertionsName } from '../../../../src/plugins/js/rules/no-chained-type-assertions.ts';
import { error } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const chained = error('chained');

runJsRule(noChainedTypeAssertionsName, {
  valid: [
    'const user = input as User;',
    'const user = <User>input;',
    'const values = [1, 2] as const;',
    'const nested = ({ id: 1 } as const) as const;',
    'const user = (input as User);',
  ],
  invalid: [
    { code: 'const user = input as object as User;', errors: [chained] },
    { code: 'const user = <User><object>input;', errors: [chained] },
    { code: 'const user = (input as object) as User;', errors: [chained] },
    { code: 'const user = input as unknown as User;', errors: [chained] },
    { code: 'use(value as A as B);', errors: [chained] },
  ],
});
