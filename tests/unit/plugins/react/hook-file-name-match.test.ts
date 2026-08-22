import { hookFileNameMatchName } from '../../../../src/plugins/react/rules/hook-file-name-match.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(
  hookFileNameMatchName,
  {
    valid: [
      validWith('export function useUserProfile() { return null; }', {
        filename: 'use-user-profile.ts',
      }),
      validWith('export const useUserProfile = () => null;', { filename: 'use-user-profile.ts' }),
    ],
    invalid: [
      invalidWith({
        filename: 'use-user-profile.ts',
        code: 'export function useProfile() { return null; }',
        errors: [{ messageId: 'mismatch', data: { expected: 'useUserProfile' } }],
      }),
    ],
  },
  'ts',
);
