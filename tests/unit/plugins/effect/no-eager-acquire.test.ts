import { noEagerAcquireName } from '../../../../src/plugins/effect/rules/no-eager-acquire.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noEagerAcquireName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'Effect.acquireRelease(Effect.sync(() => new Client()), (c) => Effect.sync(() => c.close()))',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'Effect.acquireRelease(Effect.tryPromise({ try: () => connect(), catch: (e) => e }), close)',
      ),
    },
    // An existing value from elsewhere, not built here.
    { ...ts, code: withEffect('Effect.acquireRelease(Effect.succeed(client), close)') },
    { ...ts, code: withEffect('Effect.acquireRelease(Effect.succeed(1), close)') },
    { ...ts, code: 'Effect.acquireRelease(Effect.succeed(new Client()), close)' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.acquireRelease(Effect.succeed(new Client()), close)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'Effect.acquireRelease(Effect.succeed(new Client()), (c) => Effect.sync(() => c.close()))',
      ),
      errors: [error('eager')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.acquireRelease(Effect.succeed(openPool(url)).pipe(Effect.tap(log)), close)',
      ),
      errors: [error('eager')],
    },
    {
      ...ts,
      code: withEffect(
        'const client = new Client()\nEffect.acquireRelease(Effect.succeed(client), close)',
      ),
      errors: [error('eager')],
    },
    {
      ...ts,
      code: withEffect(
        'const acquire = Effect.succeed(new Client())\nEffect.acquireUseRelease(acquire, use, close)',
      ),
      errors: [error('eager')],
    },
  ],
});
