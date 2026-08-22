import { noRunPromiseInModulesName } from '../../../../src/plugins/effect/rules/no-run-promise-in-modules.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const moduleTs = {
  filename: 'src/modules/user.ts',
  languageOptions: ts.languageOptions,
};

runEffectRule(noRunPromiseInModulesName, {
  valid: [
    { ...moduleTs, code: withEffect('export const program = Effect.succeed(1)') },
    {
      filename: 'src/main.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
    },
    {
      filename: 'src/server.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runSync(Effect.succeed(1))'),
    },
    {
      filename: 'src/app.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
    },
    { ...testTs, code: withEffect('Effect.runPromise(Effect.succeed(1))') },
    {
      filename: 'src/__tests__/app.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
    },
    {
      filename: 'src/app.spec.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
    },
    { ...moduleTs, code: NO_EFFECT },
    {
      filename: 'src/index.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runFork(Effect.succeed(1))'),
    },
    {
      filename: 'src/runtime.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runSyncExit(Effect.succeed(1))'),
    },
    validWith(withEffect('Effect.runPromise(Effect.succeed(1))'), {
      filename: 'src/lib.ts',
      options: [{ allow: ['lib.ts'] }],
    }),
    validWith(withEffect('Effect.runPromise(Effect.succeed(1))'), {
      filename: 'src/cli.ts',
      options: [{ entry: ['/cli.ts'] }],
    }),
  ],
  invalid: [
    {
      ...moduleTs,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runSync(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runFork(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runPromiseExit(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runCallback(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      filename: 'src/cli.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runSyncExit(Effect.succeed(1))'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runPromiseWith(Effect.succeed(1), {})'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runCallbackWith(Effect.succeed(1), {})'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runForkWith(Effect.succeed(1), {})'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runSyncWith(Effect.succeed(1), {})'),
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: withEffect('Effect.runPromiseExitWith(Effect.succeed(1), {})'),
      errors: [error('run')],
    },
    {
      filename: 'src/main.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('Effect.runPromise(Effect.succeed(1))'),
      options: [{ entry: ['/cli.ts'] }],
      errors: [error('run')],
    },
    {
      ...moduleTs,
      code: "import { runPromise, succeed } from 'effect/Effect';\nrunPromise(succeed(1))",
      errors: [error('run')],
    },
  ],
});
