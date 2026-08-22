import { noMultiHookFilesName } from '../../../../src/plugins/react/rules/no-multi-hook-files.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(
  noMultiHookFilesName,
  {
    valid: [
      validWith('export function useUserProfile() { return null; }', {
        filename: 'use-user-profile.ts',
      }),
    ],
    invalid: [
      invalidWith({
        filename: 'use-user-profile.ts',
        code: 'export function useUserProfile() { return null; }\nexport function useUserSettings() { return null; }',
        errors: [error('multiple')],
      }),
    ],
  },
  'ts',
);
