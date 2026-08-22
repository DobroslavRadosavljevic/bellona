import { noThrowInEffectGenName } from '../../../../src/plugins/effect/rules/no-throw-in-effect-gen.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noThrowInEffectGenName, {
  valid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { return yield* Effect.fail("x") })'),
    },
    { ...ts, code: withEffect('function outer() { throw new Error("x") }') },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { const boom = () => { throw new Error("x") }; boom() })',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(function*() { throw new Error("x") })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { throw new Error("x") })'),
      errors: [error('throwStmt')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("load")(function*() { throw "x" })'),
      errors: [error('throwStmt')],
    },
    {
      ...ts,
      code: withEffect('Effect.fnUntraced(function*() { throw new Error("x") })'),
      errors: [error('throwStmt')],
    },
  ],
});
