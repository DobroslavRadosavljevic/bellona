import { requireBoundedRetryName } from '../../../../src/plugins/effect/rules/require-bounded-retry.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const IMPORT = "import { Effect, Schedule, Stream } from 'effect';\n";

function code(body: string): string {
  return `${IMPORT}${body}`;
}

function unbounded(api: string, base: string) {
  return { messageId: 'unbounded' as const, data: { api, base } };
}

runEffectRule(requireBoundedRetryName, {
  valid: [
    { ...ts, code: code('task.pipe(Effect.retry(Schedule.recurs(3)))') },
    {
      ...ts,
      code: code(
        'task.pipe(Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.upTo("30 seconds"))))',
      ),
    },
    {
      ...ts,
      code: code('task.pipe(Effect.retry({ schedule: Schedule.spaced("1 second"), times: 5 }))'),
    },
    { ...ts, code: code('task.pipe(Effect.retry({ times: 3 }))') },
    {
      ...ts,
      code: code(
        'task.pipe(Effect.retry({ schedule: Schedule.spaced("1 second"), while: isRetryable }))',
      ),
    },
    {
      ...ts,
      code: code(
        'Effect.retry(task, Schedule.max([Schedule.exponential("1 second"), Schedule.recurs(5)]))',
      ),
    },
    {
      ...ts,
      code: code('Effect.retry(task, Schedule.during("1 minute").pipe(Schedule.jittered))'),
    },
    {
      ...ts,
      code: code(
        'const policy = Schedule.spaced("1 second").pipe(Schedule.while(({ attempt }) => attempt < 4))\ntask.pipe(Effect.repeat(policy))',
      ),
      options: [{ checkRepeat: true }],
    },
    // `repeat` is checked only with `checkRepeat`: a poll or heartbeat often runs for the whole process.
    { ...ts, code: code('task.pipe(Effect.repeat(Schedule.spaced("1 minute")))') },
    // A schedule from another module is not known.
    { ...ts, code: code('task.pipe(Effect.retry(retryPolicy))') },
    {
      ...ts,
      code: code('task.pipe(Effect.retry(Schedule.exponential("1 second").pipe(withLimit)))'),
    },
    { ...ts, code: 'task.pipe(Effect.retry(Schedule.forever))' },
    { ...ts, code: NO_EFFECT },
    validWith(code('task.pipe(Effect.retry(Schedule.spaced("1 minute")))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: code('task.pipe(Effect.retry(Schedule.exponential("100 millis")))'),
      errors: [unbounded('Effect.retry', 'exponential')],
    },
    {
      ...ts,
      code: code('task.pipe(Effect.repeat(Schedule.spaced("1 minute").pipe(Schedule.jittered)))'),
      options: [{ checkRepeat: true }],
      errors: [unbounded('Effect.repeat', 'spaced')],
    },
    {
      ...ts,
      code: code(
        'const policy = Schedule.fixed("5 seconds")\nEffect.retry(task, { schedule: policy })',
      ),
      errors: [unbounded('Effect.retry', 'fixed')],
    },
    {
      ...ts,
      code: code('stream.pipe(Stream.retry(Schedule.forever))'),
      errors: [unbounded('Stream.retry', 'forever')],
    },
    {
      // `Schedule.min` recurs while any member recurs, so `recurs(5)` does not stop it.
      ...ts,
      code: code(
        'Effect.retry(task, Schedule.min([Schedule.fibonacci("1 second"), Schedule.recurs(5)]))',
      ),
      errors: [unbounded('Effect.retry', 'fibonacci')],
    },
    {
      ...ts,
      code: `import * as Schedule from 'effect/Schedule';\nimport { Effect } from 'effect';\nEffect.repeat(task, Schedule.windowed("1 minute"))`,
      options: [{ checkRepeat: true }],
      errors: [unbounded('Effect.repeat', 'windowed')],
    },
  ],
});
