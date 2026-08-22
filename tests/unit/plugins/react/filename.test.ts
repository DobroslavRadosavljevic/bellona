import { describe, expect, it } from 'vitest';

import {
  basenameWithoutExtension,
  hookNameFromBasename,
  isComponentName,
  isHookFile,
  isHookName,
  isJsxFilename,
  isPrimaryComponentName,
  isTestFile,
  kebabToPascal,
  matchesAllow,
} from '../../../../src/plugins/react/filename.ts';

describe('react filename helpers', () => {
  it('maps kebab names to PascalCase', () => {
    expect(kebabToPascal('user-card')).toBe('UserCard');
  });

  it('treats Impl/Provider/Context as helper components', () => {
    expect(isComponentName('UserCard')).toBe(true);
    expect(isPrimaryComponentName('UserCard')).toBe(true);
    expect(isPrimaryComponentName('UserCardProvider')).toBe(false);
  });

  it('detects hook modules', () => {
    expect(isHookFile('use-user-profile.ts')).toBe(true);
    expect(isHookFile('src/hooks/use-user-profile.tsx')).toBe(true);
    expect(isHookFile('user-profile.ts')).toBe(false);
    expect(isHookFile('use-user-profile.test.ts')).toBe(false);
    expect(isHookFile('useUserProfile.ts')).toBe(false);
  });

  it('maps hook file basenames to hook names', () => {
    expect(hookNameFromBasename('use-user-profile')).toBe('useUserProfile');
    expect(hookNameFromBasename('use-id')).toBe('useId');
    expect(hookNameFromBasename('user-profile')).toBeUndefined();
  });

  it('detects official Hook names', () => {
    expect(isHookName('useState')).toBe(true);
    expect(isHookName('use')).toBe(false);
    expect(isHookName('getSorted')).toBe(false);
  });

  it('classifies test and JSX files', () => {
    expect(isTestFile('src/__tests__/card.tsx')).toBe(true);
    expect(isTestFile('card.stories.tsx')).toBe(true);
    expect(isTestFile('card.tsx')).toBe(false);
    expect(isJsxFilename('card.tsx')).toBe(true);
    expect(isJsxFilename('card.ts')).toBe(false);
    expect(basenameWithoutExtension('src/user-card.tsx')).toBe('user-card');
  });

  it('matches allow entries by path or basename', () => {
    expect(matchesAllow('src/ui/card.tsx', ['card.tsx'])).toBe(true);
    expect(matchesAllow('src/ui/card.tsx', ['src/ui'])).toBe(true);
    expect(matchesAllow('src/ui/card.tsx', ['other.tsx'])).toBe(false);
  });
});
