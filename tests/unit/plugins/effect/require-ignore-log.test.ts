import { requireIgnoreLogName } from '../../../../src/plugins/effect/rules/require-ignore-log.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function log(api: string) {
  return { messageId: 'log' as const, data: { api } };
}

runEffectRule(requireIgnoreLogName, {
  valid: [
    {
      ...ts,
      code: withEffect('task.pipe(Effect.ignore({ log: "Warn", message: "task failed" }))'),
    },
    { ...ts, code: withEffect('task.pipe(Effect.ignore({ log: true }))') },
    { ...ts, code: withEffect('Effect.ignoreCause(task, { log: "Error" })') },
    // Cleanup code.
    { ...ts, code: withEffect('Effect.addFinalizer(() => close.pipe(Effect.ignore))') },
    { ...ts, code: withEffect('task.pipe(Effect.ensuring(cleanup.pipe(Effect.ignore)))') },
    {
      ...ts,
      code: withEffect('Effect.acquireRelease(open, (handle) => Effect.ignore(handle.close))'),
    },
    { ...ts, code: withEffect('task.pipe(Effect.onExit(() => Effect.ignore(flush)))') },
    { ...ts, code: withEffect('Scope.close(scope, exit).pipe(Effect.ignore)') },
    { ...ts, code: withEffect('Effect.ignore(Scope.close(scope, exit))') },
    // An earlier step already logs the failure.
    {
      ...ts,
      code: withEffect(
        'task.pipe(Effect.tapError(() => Effect.logWarning("cache write failed")), Effect.ignore)',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'Effect.ignore(task.pipe(Effect.tapCause((cause) => Effect.logError(cause))))',
      ),
    },
    { ...testTs, code: withEffect('task.pipe(Effect.ignore)') },
    { ...ts, code: 'task.pipe(Effect.ignore)' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('task.pipe(Effect.ignore)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      // The tap runs after `ignore`, so it sees no failure.
      ...ts,
      code: withEffect('task.pipe(Effect.ignore, Effect.tapError(() => Effect.logWarning("x")))'),
      errors: [log('ignore')],
    },
    { ...ts, code: withEffect('task.pipe(Effect.ignore)'), errors: [log('ignore')] },
    { ...ts, code: withEffect('task.pipe(Effect.ignoreCause())'), errors: [log('ignoreCause')] },
    { ...ts, code: withEffect('Effect.ignore(task)'), errors: [log('ignore')] },
    {
      ...ts,
      code: withEffect('task.pipe(Effect.ignore({ log: false }))'),
      errors: [log('ignore')],
    },
    {
      ...ts,
      code: withEffect('task.pipe(Effect.ignore({ message: "x" }))'),
      errors: [log('ignore')],
    },
    {
      ...ts,
      code: `import { Effect } from 'effect';\nimport { ignore } from 'effect/Effect';\ntask.pipe(ignore)`,
      errors: [log('ignore')],
    },
    {
      ...ts,
      code: withEffect('Effect.addFinalizer(() => close.pipe(Effect.ignore))'),
      options: [{ allowInFinalizers: false }],
      errors: [log('ignore')],
    },
    {
      // Only the release argument of `acquireRelease` is cleanup.
      ...ts,
      code: withEffect('Effect.acquireRelease(open.pipe(Effect.ignore), () => Effect.void)'),
      errors: [log('ignore')],
    },
  ],
});
