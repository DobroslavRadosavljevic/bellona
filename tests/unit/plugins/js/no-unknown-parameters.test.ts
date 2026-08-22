import { noUnknownParametersName } from '../../../../src/plugins/js/rules/no-unknown-parameters.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const unknownParameter = error('unknownParameter');

runJsRule(noUnknownParametersName, {
  valid: [
    'function handle(input: User) {}',
    'function wrap(cause: unknown) {}',
    'const wrap = (cause: unknown) => {};',
    'type Handler = (cause: unknown) => void;',
    'interface Handler { handle(cause: unknown): void }',
    'function generic<Value>(value: Value) {}',
    validWith('function parse(payload: unknown) {}', { options: [{ allow: ['payload'] }] }),
  ],
  invalid: [
    { code: 'function handle(input: unknown) {}', errors: [unknownParameter] },
    { code: 'const handle = (input: unknown) => {};', errors: [unknownParameter] },
    { code: 'type Handler = (input: unknown) => void;', errors: [unknownParameter] },
    { code: 'interface Handler { handle(input: unknown): void }', errors: [unknownParameter] },
    { code: 'declare function handle(input: unknown): void;', errors: [unknownParameter] },
    invalidWith({
      code: 'function wrap(cause: unknown) {}',
      options: [{ allow: [] }],
      errors: [unknownParameter],
    }),
  ],
});
