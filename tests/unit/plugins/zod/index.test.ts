import { describe, expect, it } from 'vitest';

import zod from '../../../../src/plugins/zod/index.ts';

describe('zod plugin', () => {
  it('registers every Zod rule under a vm- id', () => {
    expect(Object.keys(zod.rules)).toEqual([
      'vm-zod-modern-format-validators',
      'vm-zod-schema-naming',
    ]);
  });
});
