import { describe, expect, it } from 'vitest';

import { matchesAllow, slash } from '../../../../src/plugins/js/filename.ts';

describe('slash', () => {
  it('normalizes Windows separators', () => {
    expect(slash('src\\public\\index.ts')).toBe('src/public/index.ts');
  });
});

describe('matchesAllow', () => {
  it('matches path fragments and basenames', () => {
    expect(matchesAllow('src/public/index.ts', ['/public/'])).toBe(true);
    expect(matchesAllow('src/barrel.ts', ['barrel.ts'])).toBe(true);
    expect(matchesAllow('src/index.ts', ['other.ts'])).toBe(false);
    expect(matchesAllow('src/index.ts', [])).toBe(false);
  });
});
