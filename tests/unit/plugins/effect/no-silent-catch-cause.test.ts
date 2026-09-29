import { noSilentCatchCauseName } from '../../../../src/plugins/effect/rules/no-silent-catch-cause.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const TYPED_WHY =
  'The typed error is dropped, so the caller gets a normal value and cannot tell that the work failed.';

function silent(api: string) {
  const causeCatcher = api === 'catchCause' || api === 'catchDefect';
  const why =
    api === 'catchCause'
      ? '`Effect.catchCause` catches every failure: typed errors, defects (bugs), and interruptions.'
      : api === 'catchDefect'
        ? '`Effect.catchDefect` catches defects: bugs and unexpected throws.'
        : TYPED_WHY;
  return {
    messageId: 'silent' as const,
    data: { api, what: causeCatcher ? 'cause' : 'error', why },
  };
}

runEffectRule(noSilentCatchCauseName, {
  valid: [
    // The handler logs, uses the cause, or fails again.
    {
      ...ts,
      code: withEffect(
        'load.pipe(Effect.catchCause((cause) => Effect.logWarning("load failed", cause).pipe(Effect.as(null))))',
      ),
    },
    { ...ts, code: withEffect('load.pipe(Effect.catchCause((cause) => Effect.succeed(cause)))') },
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catch((error) => Effect.fail(new Other({ error }))))'),
    },
    {
      ...ts,
      code: withEffect(
        'load.pipe(Effect.catchCause(() => { track(); return Effect.succeed(null) }))',
      ),
    },
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catchTag("NotFound", (e) => Effect.succeed(e.id)))'),
    },
    { ...ts, code: withEffect('load.pipe(Effect.orElseSucceed(() => null))') },
    // Typed catchers are opt-in: mapping an expected error to a value is normal.
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catchTag("NotFound", () => Effect.succeed(null)))'),
    },
    { ...ts, code: withEffect('load.pipe(Effect.catch(() => Effect.succeed(fallback)))') },
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catchCause(() => Effect.succeed(null)))'),
      options: [{ apis: ['catch'] }],
    },
    { ...testTs, code: withEffect('load.pipe(Effect.catchCause(() => Effect.succeed(null)))') },
    { ...ts, code: 'load.pipe(Effect.catchCause(() => Effect.succeed(null)))' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('load.pipe(Effect.catchCause(() => Effect.succeed(null)))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catchCause(() => Effect.succeed(null)))'),
      errors: [silent('catchCause')],
    },
    {
      ...ts,
      code: withEffect(
        'load.pipe(Effect.as(true), Effect.catchCause(() => Effect.succeed(false)))',
      ),
      errors: [silent('catchCause')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchDefect(load, (_defect) => Effect.void)'),
      errors: [silent('catchDefect')],
    },
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catch(() => { return Effect.succeedNone }))'),
      options: [{ apis: ['catch'] }],
      errors: [silent('catch')],
    },
    {
      ...ts,
      code: withEffect('load.pipe(Effect.catchTag("NotFound", () => Effect.as(Effect.void, [])))'),
      options: [{ apis: ['catchTag'] }],
      errors: [silent('catchTag')],
    },
    {
      ...ts,
      code: withEffect(
        'load.pipe(Effect.catchTags({ NotFound: (e) => Effect.succeed(e.id), Timeout: () => Effect.succeed(0) }))',
      ),
      options: [{ apis: ['catchTags'] }],
      errors: [silent('catchTags')],
    },
  ],
});
