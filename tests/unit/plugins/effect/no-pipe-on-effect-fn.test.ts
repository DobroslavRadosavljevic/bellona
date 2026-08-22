import { noPipeOnEffectFnName } from '../../../../src/plugins/effect/rules/no-pipe-on-effect-fn.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noPipeOnEffectFnName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'export const loadUser = Effect.fn("loadUser")(function*() { return 1 }, Effect.catch(() => Effect.succeed(1)))',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { return 1 }).pipe(Effect.catch(() => Effect.succeed(1)))',
      ),
    },
    { ...ts, code: withEffect('Effect.succeed(1).pipe(Effect.map((n) => n + 1))') },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect(
        'const loadUser = Effect.fn("loadUser")(function*() { return 1 }).pipe(Effect.catch(() => Effect.succeed(1)))',
      ),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'const loadUser = Effect.fn("loadUser")(function*() { return 1 }).pipe(Effect.catch(() => Effect.succeed(1)))',
      ),
      errors: [error('pipe')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.fn("loadUser")(function*() { return 1 }).pipe(Effect.annotateLogs({ m: "loadUser" }))',
      ),
      errors: [error('pipe')],
    },
    {
      ...ts,
      code: `import { fn } from 'effect/Effect';\nfn("loadUser")(function*() { return 1 }).pipe((x) => x)`,
      errors: [error('pipe')],
    },
    {
      ...ts,
      code: `import { Effect as E } from 'effect';\nE.fn("loadUser")(function*() { return 1 }).pipe((x) => x)`,
      errors: [error('pipe')],
    },
  ],
});
