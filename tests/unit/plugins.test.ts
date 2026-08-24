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
  it('uses unique bl-* plugin names and bare rule keys', () => {
    expect(js.meta.name).toBe('bl-js');
    expect(react.meta.name).toBe('bl-react');
    expect(baseUi.meta.name).toBe('bl-base-ui');
    expect(zod.meta.name).toBe('bl-zod');
    expect(tanstackRouter.meta.name).toBe('bl-tanstack-router');
    expect(elysia.meta.name).toBe('bl-elysia');
    expect(effect.meta.name).toBe('bl-effect');
    expect(Object.keys(js.rules).every((name) => !name.includes('/'))).toBe(true);
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
