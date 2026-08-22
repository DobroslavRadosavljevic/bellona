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
      validWith('export function useUserProfile() { return null; }', {
        filename: 'use-user-profile.tsx',
      }),
      validWith(
        'export function useUserProfile() {\n  function useInner() { return 1; }\n  return useInner();\n}',
        { filename: 'use-user-profile.ts' },
      ),
      validWith('export function useProfile() { return null; }', { filename: 'user-profile.ts' }),
      validWith('export function useProfile() { return null; }', {
        filename: 'use-user-profile.test.ts',
      }),
      validWith('export function useProfile() { return null; }', {
        filename: 'use-user-profile.ts',
        options: [{ allow: ['use-user-profile.ts'] }],
      }),
    ],
    invalid: [
      invalidWith({
        filename: 'use-user-profile.ts',
        code: 'export function useProfile() { return null; }',
        errors: [{ messageId: 'mismatch', data: { expected: 'useUserProfile' } }],
      }),
      invalidWith({
        filename: 'use-user-profile.ts',
        code: 'export const useProfile = () => null;',
        errors: [{ messageId: 'mismatch', data: { expected: 'useUserProfile' } }],
      }),
      invalidWith({
        filename: 'use-id.ts',
        code: 'export function useIdentifier() { return null; }',
        errors: [{ messageId: 'mismatch', data: { expected: 'useId' } }],
      }),
    ],
  },
  'ts',
);
