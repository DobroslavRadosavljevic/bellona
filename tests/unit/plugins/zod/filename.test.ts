import { describe, expect, it } from 'vitest';

import {
  isSchemaName,
  isTestFile,
  matchesAllow,
  slash,
} from '../../../../src/plugins/zod/filename.ts';

describe('slash', () => {
  it('normalizes Windows separators', () => {
    expect(slash('src\\schema.ts')).toBe('src/schema.ts');
  });
});

describe('isTestFile', () => {
  it('matches test path segments and suffixes', () => {
    expect(isTestFile('src/schema.test.ts')).toBe(true);
    expect(isTestFile('src/schema.spec.tsx')).toBe(true);
    expect(isTestFile('tests/schema.ts')).toBe(true);
    expect(isTestFile('src/__tests__/schema.ts')).toBe(true);
    expect(isTestFile('src/schema.ts')).toBe(false);
  });
});

describe('matchesAllow', () => {
  it('matches path fragments and basenames', () => {
    expect(matchesAllow('src/generated/schema.ts', ['/generated/'])).toBe(true);
    expect(matchesAllow('src/schema.ts', ['schema.ts'])).toBe(true);
    expect(matchesAllow('src/schema.ts', ['other.ts'])).toBe(false);
    expect(matchesAllow('src/schema.ts', [])).toBe(false);
  });
});

describe('isSchemaName', () => {
  it('requires PascalCase names that end in Schema', () => {
    expect(isSchemaName('UserSchema')).toBe(true);
    expect(isSchemaName('HTTPSchema')).toBe(true);
    expect(isSchemaName('userSchema')).toBe(false);
    expect(isSchemaName('User')).toBe(false);
    expect(isSchemaName('User_Schema')).toBe(false);
    expect(isSchemaName('Schema')).toBe(false);
  });
});
