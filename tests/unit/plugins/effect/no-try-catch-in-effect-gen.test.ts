import { noTryCatchInEffectGenName } from '../../../../src/plugins/effect/rules/no-try-catch-in-effect-gen.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noTryCatchInEffectGenName, {
  valid: [
    { ...ts, code: withEffect('Effect.gen(function*() { return yield* Effect.succeed(1) })') },
    { ...ts, code: withEffect('function outer() { try { return 1 } catch { return 0 } }') },
    {
      ...ts,
      code: withEffect('Effect.fn("load")(function*() { return yield* Effect.succeed(1) })'),
    },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { const run = () => { try { return 1 } catch { return 0 } }; return run() })',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(function*() { try { return 1 } catch { return 0 } })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { try { return 1 } catch { return 0 } })'),
      errors: [error('tryCatch')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("load")(function*() { try { return 1 } catch { return 0 } })'),
      errors: [error('tryCatch')],
    },
    {
      ...ts,
      code: withEffect('Effect.fnUntraced(function*() { try { return 1 } catch { return 0 } })'),
      errors: [error('tryCatch')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { try { return 1 } finally { yield* Effect.void } })',
      ),
      errors: [error('tryCatch')],
    },
  ],
});
