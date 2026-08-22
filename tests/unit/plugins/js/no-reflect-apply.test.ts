import { noReflectApplyName } from '../../../../src/plugins/js/rules/no-reflect-apply.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'reflectApply' };

runJsRule(noReflectApplyName, {
  valid: [
    'const value = operation.apply(owner, args);',
    'Reflect.get(owner, key);',
    'const Reflect = { apply() { return 1; } }; Reflect.apply();',
    'function invoke(Reflect: { apply(): number }) { return Reflect.apply(); }',
  ],
  invalid: [
    { code: 'const value = Reflect.apply(operation, owner, args);', errors: [error] },
    { code: "const value = Reflect['apply'](operation, owner, args);", errors: [error] },
  ],
});
