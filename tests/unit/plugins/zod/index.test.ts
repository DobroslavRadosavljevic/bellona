import { describe, expect, it } from 'vitest';

import zod from '../../../../src/plugins/zod/index.ts';

describe('zod plugin', () => {
  it('registers every Zod rule under a bn- id', () => {
    expect(Object.keys(zod.rules)).toEqual([
      'bn-zod-modern-format-validators',
      'bn-zod-schema-naming',
    ]);
  });
});
