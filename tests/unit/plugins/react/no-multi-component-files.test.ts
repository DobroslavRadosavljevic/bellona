import { noMultiComponentFilesName } from '../../../../src/plugins/react/rules/no-multi-component-files.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noMultiComponentFilesName, {
  valid: [
    validWith('function UserCard() { return null; }\nfunction UserCardImpl() { return null; }', {
      filename: 'user-card.tsx',
    }),
    validWith('function UserCard() {\n  function UserBadge() { return null; }\n  return null;\n}', {
      filename: 'user-card.tsx',
    }),
    validWith(
      'function UserCard() { return null; }\nfunction UserCardProvider() { return null; }',
      { filename: 'user-card.tsx' },
    ),
  ],
  invalid: [
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserBadge() { return null; }',
      errors: [error('multiple')],
    }),
  ],
});
