import { describe, expect, it } from 'vitest';

import {
  isComponentName,
  isHookFile,
  isPrimaryComponentName,
  kebabToPascal,
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
    expect(isHookFile('user-profile.ts')).toBe(false);
    expect(isHookFile('use-user-profile.test.ts')).toBe(false);
  });
});
