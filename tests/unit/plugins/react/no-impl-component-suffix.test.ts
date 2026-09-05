import { noImplComponentSuffixName } from '../../../../src/plugins/react/rules/no-impl-component-suffix.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noImplComponentSuffixName, {
  valid: [
    validWith('function UserCard() { return null; }', { filename: 'user-card.tsx' }),
    validWith(
      'function UserCard() { return null; }\nfunction UserCardProvider() { return null; }',
      {
        filename: 'user-card.tsx',
      },
    ),
    validWith('const UserCard = memo(() => null);', { filename: 'user-card.tsx' }),
    validWith('function Implementation() { return null; }', { filename: 'implementation.tsx' }),
    validWith('function UserCardImpl() { return null; }', { filename: 'user-card.test.tsx' }),
    validWith('function UserCardImpl() { return null; }', {
      filename: 'user-card.tsx',
      options: [{ allow: ['user-card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserCardImpl() { return null; }',
      errors: [{ messageId: 'implSuffix', data: { name: 'UserCardImpl' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() {\n  function RowImpl() { return null; }\n  return null;\n}',
      errors: [{ messageId: 'implSuffix', data: { name: 'RowImpl' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const CrumbLinkImpl = () => null;',
      errors: [{ messageId: 'implSuffix', data: { name: 'CrumbLinkImpl' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const UserCardImpl = memo(() => null);',
      errors: [{ messageId: 'implSuffix', data: { name: 'UserCardImpl' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export default memo(function UserCardImpl() { return null; });',
      errors: [{ messageId: 'implSuffix', data: { name: 'UserCardImpl' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserCardImplProvider() { return null; }',
      errors: [{ messageId: 'implSuffix', data: { name: 'UserCardImplProvider' } }],
    }),
  ],
});
