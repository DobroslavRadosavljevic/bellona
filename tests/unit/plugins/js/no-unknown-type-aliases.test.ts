import { noUnknownTypeAliasesName } from '../../../../src/plugins/js/rules/no-unknown-type-aliases.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'unknownAlias' };

runJsRule(noUnknownTypeAliasesName, {
  valid: ['type User = { readonly id: string };', 'type Alias = string; type UserId = Alias;'],
  invalid: [
    { code: 'type Alias = unknown;', errors: [error] },
    { code: 'type Current = unknown;', errors: [error] },
    { code: 'type UnknownValue = unknown; type Alias = UnknownValue;', errors: [error, error] },
  ],
});
