import { preferEffectFnName } from '../../../../src/plugins/effect/rules/prefer-effect-fn.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect, withVitestEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferEffectFnName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'export const loadUser = Effect.fn("loadUser")(function*(id: string) { return id })',
      ),
    },
    { ...ts, code: withEffect('export const program = Effect.gen(function*() { return 1 })') },
    { ...ts, code: withEffect('export const ok = () => Effect.succeed(1)') },
    {
      ...testTs,
      code: withVitestEffect('it.effect("divides", () => Effect.gen(function*() { return 1 }))'),
    },
    {
      filename: 'src/app.test.ts',
      languageOptions: ts.languageOptions,
      code: withVitestEffect('it.live("divides", () => Effect.gen(function*() { return 1 }))'),
    },
    { ...ts, code: withEffect('function outside() { return 1 }') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('function load() { return Effect.gen(function*() { return 1 }) }'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('function loadUser() { return Effect.gen(function*() { return 1 }) }'),
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: withEffect('const loadUser = () => Effect.gen(function*() { return 1 })'),
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: withEffect(
        'const loadUser = () => Effect.gen(function*() { return 1 }).pipe(Effect.catch(() => Effect.succeed(1)))',
      ),
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: withEffect(
        'function loadUser() { if (true) { return Effect.gen(function*() { return 1 }) } return Effect.succeed(1) }',
      ),
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: withEffect(
        'export const loadUser = function() { return Effect.gen(function*() { return 1 }) }',
      ),
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: `import * as Effect from 'effect/Effect';\nconst load = () => Effect.gen(function*() { return 1 })`,
      errors: [error('wrap')],
    },
    {
      ...ts,
      code: withEffect('class Store { load() { return Effect.gen(function*() { return 1 }) } }'),
      errors: [error('wrap')],
    },
  ],
});
