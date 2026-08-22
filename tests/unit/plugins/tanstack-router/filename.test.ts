import { describe, expect, it } from 'vitest';

import { isTestFile, matchesAllow } from '../../../../src/plugins/tanstack-router/filename.ts';

describe('isTestFile', () => {
  it('detects test and fixture paths', () => {
    expect(isTestFile('src/foo.test.tsx')).toBe(true);
    expect(isTestFile('src/__tests__/foo.ts')).toBe(true);
    expect(isTestFile('src/routes/posts.tsx')).toBe(false);
  });
});

describe('matchesAllow', () => {
  it('matches path substrings and basenames', () => {
    expect(matchesAllow('src/legacy/nav.tsx', ['legacy'])).toBe(true);
    expect(matchesAllow('src/routes/posts.tsx', ['nav.tsx'])).toBe(false);
    expect(matchesAllow('src/routes/nav.tsx', ['nav.tsx'])).toBe(true);
  });
});
