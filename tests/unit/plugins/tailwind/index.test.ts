import { describe, expect, it } from 'vitest';

import tailwind from '../../../../src/plugins/tailwind/index.ts';

describe('tailwind plugin', () => {
  it('registers every Tailwind rule under a tailwind slug', () => {
    expect(Object.keys(tailwind.rules)).toEqual([
      'no-classname-constants',
      'no-dynamic-class-construction',
      'no-v3-arbitrary-var',
    ]);
  });
});
