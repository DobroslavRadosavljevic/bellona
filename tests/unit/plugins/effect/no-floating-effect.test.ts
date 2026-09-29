import { noFloatingEffectName } from '../../../../src/plugins/effect/rules/no-floating-effect.ts';
import { error, validWith } from '../../lib/cases.ts';
import { EFFECT_NS_IMPORT, NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noFloatingEffectName, {
  valid: [
    { ...ts, code: withEffect('Effect.gen(function*() { yield* Effect.log("x") })') },
    { ...ts, code: withEffect('Effect.gen(function*() { const x = Effect.log("x"); yield* x })') },
    { ...ts, code: withEffect('Effect.fn("a")(function*() { return Effect.log("x") })') },
    // Runners and fn factories are not Effects.
    { ...ts, code: withEffect('Effect.gen(function*() { Effect.runFork(Effect.log("x")) })') },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { Effect.log("x").pipe(Effect.runFork) })'),
    },
    { ...ts, code: withEffect('Effect.gen(function*() { Effect.fn("a")(function*() {}) })') },
    // Outside a generator, or in a nested function.
    { ...ts, code: withEffect('function run() { Effect.log("x") }') },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { const f = () => { Effect.log("x") }; yield* Effect.void })',
      ),
    },
    { ...ts, code: withEffect('Effect.gen(function*() { console.log("x"); list.push(1) })') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(function*() { Effect.log("x") })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { Effect.log("x") })'),
      errors: [error('floating')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("a")(function*() { Effect.fail("boom"); return 1 })'),
      errors: [error('floating')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.fnUntraced(function*() { Effect.sleep("1 second").pipe(Effect.forkChild) })',
      ),
      errors: [error('floating')],
    },
    {
      ...ts,
      code: `import { Effect, Ref } from 'effect';\nEffect.gen(function*() { const ref = yield* Ref.make(0); Ref.set(ref, 1) })`,
      errors: [error('floating')],
    },
    {
      ...ts,
      code: `import { Deferred, Effect } from 'effect';\nEffect.gen(function*() { Deferred.succeed(d, 1) })`,
      errors: [error('floating')],
    },
    {
      ...ts,
      code: `${EFFECT_NS_IMPORT}Effect.gen(function*() { Effect.logInfo("x") })`,
      errors: [error('floating')],
    },
  ],
});
