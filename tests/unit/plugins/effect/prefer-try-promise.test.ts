import { preferTryPromiseName } from '../../../../src/plugins/effect/rules/prefer-try-promise.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferTryPromiseName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: () => Promise.resolve(1), catch: (cause) => cause })',
      ),
    },
    { ...ts, code: withEffect('Effect.tryPromise(() => Promise.resolve(1))') },
    { ...testTs, code: withEffect('Effect.promise(() => Promise.resolve(1))') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.promise(() => Promise.resolve(1))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.promise(() => Promise.resolve(1))'),
      errors: [error('promise')],
    },
    {
      ...ts,
      code: `import { promise } from 'effect/Effect';\npromise(() => Promise.resolve(1))`,
      errors: [error('promise')],
    },
    {
      ...ts,
      code: `import { Effect as E } from 'effect';\nE.promise(() => Promise.resolve(1))`,
      errors: [error('promise')],
    },
  ],
});
