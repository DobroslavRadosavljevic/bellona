import { componentFileNameMatchName } from '../../../../src/plugins/react/rules/component-file-name-match.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(componentFileNameMatchName, {
  valid: [
    validWith('export function UserCard() { return null; }', { filename: 'user-card.tsx' }),
    validWith('export const UserCard = () => null;', { filename: 'user-card.tsx' }),
    validWith('export const UserCard = memo(() => null);', { filename: 'user-card.tsx' }),
    validWith('export const UserCard = forwardRef(() => null);', { filename: 'user-card.tsx' }),
    validWith(
      'export function UserCard() { return null; }\nexport function UserCardSkeleton() { return null; }',
      { filename: 'user-card.tsx' },
    ),
    validWith(
      'export function UserCard() { return null; }\nexport function UserCardProvider() { return null; }',
      { filename: 'user-card.tsx' },
    ),
    validWith('export default function UserCard() { return null; }', { filename: 'user-card.tsx' }),
    validWith('function UserCard() { return null; }\nexport default UserCard;', {
      filename: 'user-card.tsx',
    }),
    validWith('export default memo(function UserCard() { return null; });', {
      filename: 'user-card.tsx',
    }),
    validWith('export function ProfileCard() { return null; }', { filename: 'index.tsx' }),
    validWith('export function ProfileCard() { return null; }', { filename: 'user-card.ts' }),
    validWith('export function ProfileCard() { return null; }', { filename: 'user-card.test.tsx' }),
    validWith('export function ProfileCard() { return null; }', {
      filename: 'user-card.tsx',
      options: [{ allow: ['user-card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export function ProfileCard() { return null; }',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export const ProfileCard = () => null;',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export const ProfileCard = memo(() => null);',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export default function ProfileCard() { return null; }',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function ProfileCard() { return null; }\nexport default ProfileCard;',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'export default memo(function ProfileCard() { return null; });',
      errors: [{ messageId: 'mismatch', data: { expected: 'UserCard' } }],
    }),
  ],
});
