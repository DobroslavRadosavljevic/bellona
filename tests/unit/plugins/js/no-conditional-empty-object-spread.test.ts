import { noConditionalEmptyObjectSpreadName } from '../../../../src/plugins/js/rules/no-conditional-empty-object-spread.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'avoid' };

runJsRule(noConditionalEmptyObjectSpreadName, {
  valid: [
    'const result = { value };',
    'const result = { ...values };',
    'const result = condition ? { value } : {};',
  ],
  invalid: [
    {
      code: 'const result = { ...(value !== undefined ? { value } : {}) };',
      errors: [error],
    },
    {
      code: 'const result = { ...(condition ? {} : { value }) };',
      errors: [error],
    },
  ],
});
