import { componentFileNameMatchName } from '../../../../src/plugins/react/rules/component-file-name-match.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(componentFileNameMatchName, {
  valid: [
    validWith('export function UserCard() { return null; }', { filename: 'user-card.tsx' }),
    validWith('export const UserCard = () => null;', { filename: 'user-card.tsx' }),
    validWith(
      'export function UserCard() { return null; }\nexport function UserCardSkeleton() { return null; }',
      { filename: 'user-card.tsx' },
    ),
    validWith(
      'export function UserCard() { return null; }\nexport function UserCardProvider() { return null; }',
      { filename: 'user-card.tsx' },
    ),
    validWith('export default function UserCard() { return null; }', { filename: 'user-card.tsx' }),
  ],
  invalid: [
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export function ProfileCard() { return null; }',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
  ],
});
