import { noReturnEffectInGenName } from '../../../../src/plugins/effect/rules/no-return-effect-in-gen.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noReturnEffectInGenName, {
  valid: [
    { ...ts, code: withEffect('Effect.gen(function*() { return yield* Effect.fail("x") })') },
    { ...ts, code: withEffect('Effect.gen(function*() { return 1 })') },
    { ...ts, code: withEffect('function load() { return Effect.fail("x") }') },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { const run = () => { return Effect.log("x") }; return run })',
      ),
    },
    // `Effect.fn` factories and runners are not Effects.
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { return Effect.fnUntraced(function*() {}) })'),
    },
    { ...ts, code: withEffect('Effect.gen(function*() { return Effect.runSync(Effect.void) })') },
    {
      ...ts,
      code: withEffect(
        'Layer.effect(Db, Effect.gen(function*() { return Db.of({ q: () => Effect.succeed(1) }) }))',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(function*() { return Effect.fail("x") })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { return Effect.fail("x") })'),
      errors: [error('returnEffect')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("load")(function*(id: string) { return Effect.succeed(id) })'),
      errors: [error('returnEffect')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.fnUntraced(function*() { if (ok) { return Effect.log("x").pipe(Effect.as(1)) } return 2 })',
      ),
      errors: [error('returnEffect')],
    },
  ],
});
