import { describe, expect, it } from 'vitest';

import zod from '../../../../src/plugins/zod/index.ts';

describe('zod plugin', () => {
  it('registers every Zod rule under a zod- id', () => {
    expect(Object.keys(zod.rules)).toEqual(['zod-modern-format-validators', 'zod-schema-naming']);
  });
});
