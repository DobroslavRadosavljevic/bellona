import { noNewErrorInEffectName } from '../../../../src/plugins/effect/rules/no-new-error-in-effect.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noNewErrorInEffectName, {
  valid: [
    // A defect is a bug, so a plain `Error` is fine.
    { ...ts, code: withEffect('Effect.die(new Error("bug"))') },
    { ...ts, code: withEffect('Effect.die(Error("bug"))') },
    {
      ...ts,
      code: `import { Cause, Effect, Exit } from 'effect';\nCause.die(new Error("x"));\nExit.die(new Error("y"))`,
    },
    {
      ...ts,
      code: `import { Deferred } from 'effect';\nDeferred.die(deferred, new Error("x"))`,
    },
    // Not a typed failure: plain helpers, a throw inside `try`, logs, web APIs.
    { ...ts, code: withEffect('function parse() { throw new Error("bad") }') },
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: async () => { throw new Error("download failed") }, catch: (cause) => new Download({ cause }) })',
      ),
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { yield* Effect.logError(new Error("x")) })'),
    },
    { ...ts, code: withEffect('controller.error(new Error("interrupted"))') },
    { ...ts, code: withEffect('Effect.fail(new NotFound({ id }))') },
    { ...ts, code: withEffect('class Local extends Error {}') },
    { ...testTs, code: withEffect('Effect.fail(new Error("x"))') },
    { ...ts, code: 'Effect.fail(new Error("x"))' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.fail(new Error("x"))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    { ...ts, code: withEffect('Effect.fail(new Error("x"))'), errors: [error('error')] },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { return yield* Effect.fail(Error("x")) })'),
      errors: [error('error')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: load, catch: (cause) => new Error(String(cause)) })',
      ),
      errors: [error('error')],
    },
    {
      ...ts,
      code: withEffect('Effect.try({ try: parse, catch: (cause) => { return new Error("bad") } })'),
      errors: [error('error')],
    },
    {
      ...ts,
      code: withEffect('task.pipe(Effect.mapError(() => new Error("load failed")))'),
      errors: [error('error')],
    },
    {
      ...ts,
      code: withEffect('Effect.failSync(() => new Error("x"))'),
      errors: [error('error')],
    },
    {
      ...ts,
      code: `import { Cause } from 'effect';\nCause.fail(new Error("x"))`,
      errors: [error('error')],
    },
  ],
});
