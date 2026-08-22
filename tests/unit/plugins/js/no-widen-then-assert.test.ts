import { noWidenThenAssertName } from '../../../../src/plugins/js/rules/no-widen-then-assert.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'widenThenAssert' };

runJsRule(noWidenThenAssertName, {
  valid: [
    "const source = { id: 'first' }; const widened: unknown = source;",
    'declare const input: unknown; const parsed = input as { readonly id: string };',
  ],
  invalid: [
    {
      code: "const source = { id: 'second' }; const widened: unknown = source; const parsed = widened as { readonly id: string };",
      errors: [error],
    },
  ],
});
