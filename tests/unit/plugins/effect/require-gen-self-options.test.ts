import { requireGenSelfOptionsName } from '../../../../src/plugins/effect/rules/require-gen-self-options.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(requireGenSelfOptionsName, {
  valid: [
    { ...ts, code: withEffect('Effect.gen(function* () { return 1 })') },
    {
      ...ts,
      code: withEffect(`
class MyService {
  readonly local = 1
  compute = Effect.gen({ self: this }, function* () {
    return yield* Effect.succeed(this.local + 1)
  })
}
`),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(this, function* () { return 1 })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(this, function* () { return 1 })'),
      errors: [error('selfThis')],
    },
    {
      ...ts,
      code: withEffect(`
class MyService {
  readonly local = 1
  compute = Effect.gen(this, function* () {
    return yield* Effect.succeed(this.local + 1)
  })
}
`),
      errors: [error('selfThis')],
    },
  ],
});
