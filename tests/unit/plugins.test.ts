import { describe, expect, it } from 'vitest';

import { plugins } from '../../src/index.ts';
import baseUi from '../../src/plugins/base-ui/index.ts';
import elysia from '../../src/plugins/elysia/index.ts';
import js from '../../src/plugins/js/index.ts';
import react from '../../src/plugins/react/index.ts';
import tanstackRouter from '../../src/plugins/tanstack-router/index.ts';
import zod from '../../src/plugins/zod/index.ts';

describe('plugins', () => {
  it('uses stable Oxlint plugin names matching subpath exports', () => {
    expect(js.meta.name).toBe('js');
    expect(react.meta.name).toBe('react');
    expect(baseUi.meta.name).toBe('base-ui');
    expect(zod.meta.name).toBe('zod');
    expect(tanstackRouter.meta.name).toBe('tanstack-router');
    expect(elysia.meta.name).toBe('elysia');
    expect(Object.keys(js.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(react.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(baseUi.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(zod.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(tanstackRouter.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(Object.keys(elysia.rules).every((name) => name.startsWith('vm-'))).toBe(true);
    expect(plugins).toEqual({
      js: 'vamana/js',
      react: 'vamana/react',
      baseUi: 'vamana/base-ui',
      zod: 'vamana/zod',
      tanstackRouter: 'vamana/tanstack-router',
      elysia: 'vamana/elysia',
    });
  });
});
