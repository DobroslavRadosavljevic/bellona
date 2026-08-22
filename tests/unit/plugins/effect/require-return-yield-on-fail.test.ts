import { requireReturnYieldOnFailName } from '../../../../src/plugins/effect/rules/require-return-yield-on-fail.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(requireReturnYieldOnFailName, {
  valid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { return yield* Effect.fail("x") })'),
    },
    {
      ...ts,
      code: withEffect(
        'class Boom extends Schema.TaggedError<Boom>()("Boom", { message: Schema.String }) {}\nEffect.gen(function*() { return yield* new Boom({ message: "x" }) })',
      ),
    },
    { ...ts, code: withEffect('Effect.gen(function*() { return yield* Effect.succeed(1) })') },
    { ...ts, code: withEffect('function* g() { yield* Effect.fail("x") }') },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { function* inner() { yield* Effect.fail("x") }; return inner })',
      ),
    },
    { ...ts, code: NO_EFFECT },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { yield* new TypeError("x"); return 1 })'),
    },
    validWith(withEffect('Effect.gen(function*() { yield* Effect.fail("x") })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { yield* Effect.fail("x"); return 1 })'),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("load")(function*() { yield* Effect.die("x") })'),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect(
        'class Boom extends Schema.TaggedError<Boom>()("Boom", { message: Schema.String }) {}\nEffect.gen(function*() { yield* new Boom({ message: "x" }) })',
      ),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { const x = yield* Effect.fail("x") })'),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { yield* Effect.failSync(() => "x") })'),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { yield* Effect.dieMessage("x") })'),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect(
        'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {}) {}\nEffect.gen(function*() { yield* new NotFound() })',
      ),
      errors: [error('returnYield')],
    },
    {
      ...ts,
      code: withEffect('Effect.fnUntraced(function*() { yield* Effect.fail("x") })'),
      errors: [error('returnYield')],
    },
  ],
});
