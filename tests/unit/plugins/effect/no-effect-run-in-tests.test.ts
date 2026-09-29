import { noEffectRunInTestsName } from '../../../../src/plugins/effect/rules/no-effect-run-in-tests.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function run(api: string) {
  return { messageId: 'run' as const, data: { api } };
}

runEffectRule(noEffectRunInTestsName, {
  valid: [
    {
      ...testTs,
      code: withEffect('it.effect("loads", () => Effect.gen(function*() { yield* load }))'),
    },
    // Not a test file.
    { ...ts, code: withEffect('Effect.runPromise(load)') },
    { ...testTs, code: 'Effect.runPromise(load)' },
    { ...testTs, code: NO_EFFECT },
    validWith(withEffect('Effect.runPromise(load)'), {
      filename: 'src/app.test.ts',
      options: [{ allow: ['app.test.ts'] }],
    }),
  ],
  invalid: [
    {
      ...testTs,
      code: withEffect('it("loads", async () => { await Effect.runPromise(load) })'),
      errors: [run('Effect.runPromise')],
    },
    {
      ...testTs,
      code: withEffect('it("loads", () => { load.pipe(Effect.runSync) })'),
      errors: [run('Effect.runSync')],
    },
    {
      ...testTs,
      code: `import { Effect, ManagedRuntime } from 'effect';\nconst runtime = ManagedRuntime.make(AppLayer)`,
      errors: [run('ManagedRuntime.make')],
    },
    {
      ...testTs,
      code: `import * as ManagedRuntime from 'effect/ManagedRuntime';\nconst runtime = ManagedRuntime.make(AppLayer)`,
      errors: [run('ManagedRuntime.make')],
    },
  ],
});
