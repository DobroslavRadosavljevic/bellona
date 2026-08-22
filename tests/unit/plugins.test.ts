import { describe, expect, it } from 'vitest';

import { plugins } from '../../src/index.ts';
import js from '../../src/plugins/js/index.ts';
import tanstackRouter from '../../src/plugins/tanstack-router/index.ts';

describe('plugins', () => {
  it('uses stable Oxlint plugin names matching subpath exports', () => {
    expect(js.meta.name).toBe('js');
    expect(tanstackRouter.meta.name).toBe('tanstack-router');
    expect(Object.keys(js.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(tanstackRouter.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(plugins).toEqual({
      js: 'vamana/js',
      tanstackRouter: 'vamana/tanstack-router',
    });
  });
});
