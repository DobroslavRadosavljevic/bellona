import { describe, expect, it } from 'vitest';

import { plugins } from '../../src/index.ts';
import baseUi from '../../src/plugins/base-ui/index.ts';
import effect from '../../src/plugins/effect/index.ts';
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
    expect(effect.meta.name).toBe('effect');
    expect(Object.keys(js.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(react.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(baseUi.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(zod.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(tanstackRouter.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(elysia.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(effect.rules).every((name) => name.startsWith('bn-'))).toBe(true);
    expect(Object.keys(effect.rules)).toHaveLength(25);
    expect(plugins).toEqual({
      js: 'bellona/js',
      react: 'bellona/react',
      baseUi: 'bellona/base-ui',
      zod: 'bellona/zod',
      tanstackRouter: 'bellona/tanstack-router',
      elysia: 'bellona/elysia',
      effect: 'bellona/effect',
    });
  });
});
