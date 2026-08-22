import { noItEffectScopedName } from '../../../../src/plugins/effect/rules/no-it-effect-scoped.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, withVitestEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noItEffectScopedName, {
  valid: [
    {
      ...testTs,
      code: withVitestEffect('it.effect("ok", () => Effect.gen(function*() { return 1 }))'),
    },
    { ...testTs, code: withVitestEffect('it.live("ok", () => Effect.succeed(1))') },
    { ...testTs, code: NO_EFFECT },
    {
      ...testTs,
      code: withVitestEffect(
        'it.effect("resource", () => Effect.gen(function*() { const x = yield* Effect.acquireRelease(Effect.succeed(1), () => Effect.void); return x }))',
      ),
    },
    validWith(withVitestEffect('it.effect("x", () => Effect.scoped(Effect.void))'), {
      filename: 'src/app.test.ts',
      options: [{ allow: ['app.test.ts'] }],
    }),
  ],
  invalid: [
    {
      ...testTs,
      code: withVitestEffect('it.effect("x", () => Effect.scoped(Effect.void))'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.live("x", () => Effect.scoped(Effect.void))'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect(
        'it.effect("x", () => Effect.gen(function*() { return 1 }).pipe(Effect.scoped))',
      ),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.effect("x", () => { return Effect.scoped(Effect.void) })'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.scopedLive("x", () => Effect.void)'),
      errors: [error('scopedLive')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.effect.skip("x", () => Effect.scoped(Effect.void))'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.live.skip("x", () => Effect.scoped(Effect.void))'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect(
        'import { pipe } from "effect";\nit.effect("x", () => pipe(Effect.void, Effect.scoped))',
      ),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.effect("x", function () { return Effect.scoped(Effect.void) })'),
      errors: [error('scoped')],
    },
    {
      ...testTs,
      code: withVitestEffect('it.effect.only("x", () => Effect.scoped(Effect.void))'),
      errors: [error('scoped')],
    },
  ],
});
