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
    validWith('function UserCard() { return null; }\nfunction UserCardContext() { return null; }', {
      filename: 'user-card.tsx',
    }),
    validWith('const UserCard = memo(() => null);', { filename: 'user-card.tsx' }),
    validWith('function UserCard() { return null; }\nfunction UserBadge() { return null; }', {
      filename: 'user-card.test.tsx',
    }),
    validWith('function UserCard() { return null; }\nfunction UserBadge() { return null; }', {
      filename: 'user-card.tsx',
      options: [{ allow: ['user-card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserBadge() { return null; }',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const UserCard = () => null;\nconst UserBadge = () => null;',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const UserCard = memo(() => null);\nconst UserBadge = memo(() => null);',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nconst UserBadge = forwardRef(() => null);',
      errors: [error('multiple')],
    }),
  ],
});
