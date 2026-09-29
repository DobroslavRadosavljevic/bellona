import { noObjectKeysAssertionName } from '../../../../src/plugins/js/rules/no-object-keys-assertion.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const keysAssertion = error('keysAssertion');

runJsRule(noObjectKeysAssertionName, {
  valid: [
    { name: 'plain keys', code: 'const keys = Object.keys(user);' },
    {
      name: 'plain entries',
      code: 'for (const [key, value] of Object.entries(user)) use(key, value);',
    },
    { name: 'values are not keys', code: 'const values = Object.values(user) as User[];' },
    { name: 'declared key list', code: 'const fields = ["id", "name"] as const;' },
    { name: 'assertion on another call', code: 'const keys = listKeys(user) as (keyof User)[];' },
    {
      name: 'local Object binding',
      code: 'const Object = { keys: () => [] }; const keys = Object.keys() as string[];',
    },
    validWith('const keys = Object.keys(user) as (keyof User)[];', {
      name: 'allow skips the file',
      filename: 'src/generated/model.ts',
      options: [{ allow: ['/generated/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'keys as keyof',
      code: 'const keys = Object.keys(user) as (keyof User)[];',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'keys as Array<keyof T> in a loop',
      code: 'function f<T extends object>(next: T) { for (const key of Object.keys(next) as Array<keyof T>) use(key); }',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'entries as tuples',
      code: 'const pairs = Object.entries(prices) as [Model, Price][];',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'angle-bracket assertion',
      code: 'const keys = <(keyof User)[]>Object.keys(user);',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'parenthesized call and computed method',
      code: 'const keys = (Object["keys"](user)) as Key[];',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'double assertion reports once',
      code: 'const keys = Object.keys(user) as unknown as Key[];',
      errors: [keysAssertion],
    }),
    invalidWith({
      name: 'allow for another path does not skip',
      code: 'const keys = Object.keys(user) as Key[];',
      filename: 'src/model.ts',
      options: [{ allow: ['/generated/'] }],
      errors: [keysAssertion],
    }),
  ],
});
