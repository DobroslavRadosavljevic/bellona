import { noReflectGetName } from '../../../../src/plugins/js/rules/no-reflect-get.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'reflectGet' };

runJsRule(noReflectGetName, {
  valid: [
    'const value = owner.property;',
    'const value = owner[key];',
    'Reflect.set(owner, key, value);',
    'const Reflect = { get() { return 1; } }; Reflect.get();',
    'function read(Reflect: { get(): number }) { return Reflect.get(); }',
  ],
  invalid: [
    { name: 'static access', code: 'const value = Reflect.get(owner, key);', errors: [error] },
    { name: 'computed access', code: "const value = Reflect['get'](owner, key);", errors: [error] },
  ],
});
