import { describe, expect, it } from 'vitest';

import { isTestFile, matchesAllow, slash } from '../../../../src/plugins/tailwind/filename.ts';

describe('slash', () => {
  it('normalizes Windows separators', () => {
    expect(slash('src\\ui.ts')).toBe('src/ui.ts');
  });
});

describe('isTestFile', () => {
  it('matches test path segments and suffixes', () => {
    expect(isTestFile('src/ui.test.ts')).toBe(true);
    expect(isTestFile('src/ui.spec.tsx')).toBe(true);
    expect(isTestFile('tests/ui.ts')).toBe(true);
    expect(isTestFile('src/__tests__/ui.ts')).toBe(true);
    expect(isTestFile('src/ui.ts')).toBe(false);
  });
});

describe('matchesAllow', () => {
  it('matches path fragments and basenames', () => {
    expect(matchesAllow('src/generated/ui.ts', ['/generated/'])).toBe(true);
    expect(matchesAllow('src/ui.ts', ['ui.ts'])).toBe(true);
    expect(matchesAllow('src/ui.ts', ['other.ts'])).toBe(false);
    expect(matchesAllow('src/ui.ts', [])).toBe(false);
  });
});
