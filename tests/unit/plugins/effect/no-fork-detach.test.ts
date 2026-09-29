import { noForkDetachName } from '../../../../src/plugins/effect/rules/no-fork-detach.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const moduleTs = { ...ts, filename: 'src/billing/status.service.ts' };

runEffectRule(noForkDetachName, {
  valid: [
    { ...moduleTs, code: withEffect('Effect.gen(function*() { yield* Effect.forkChild(task) })') },
    {
      ...moduleTs,
      code: withEffect(
        'Layer.effect(Svc, Effect.gen(function*() { yield* Effect.forkScoped(loop); return Svc.of({}) }))',
      ),
    },
    // A service method forks a child of the request fiber.
    {
      ...moduleTs,
      code: withEffect(`
Layer.effect(Svc, Effect.gen(function*() {
  const run = Effect.fn("Svc.run")(function*() { yield* Effect.forkChild(task) })
  return Svc.of({ run })
}))
`),
    },
    // Entry files may detach.
    { ...ts, filename: 'src/main.ts', code: withEffect('Effect.forkDetach(task)') },
    validWith(withEffect('Effect.forkDetach(task)'), {
      filename: 'src/jobs/worker.ts',
      options: [{ entry: ['/worker.ts'] }],
    }),
    { ...testTs, code: withEffect('Effect.forkDetach(task)') },
    { ...moduleTs, code: 'Effect.forkDetach(task)' },
    { ...moduleTs, code: NO_EFFECT },
    validWith(withEffect('Effect.forkDetach(task)'), {
      filename: 'src/app/jobs.ts',
      options: [{ allow: ['jobs.ts'] }],
    }),
  ],
  invalid: [
    {
      ...moduleTs,
      code: withEffect(
        'Effect.gen(function*() { if (stale) { yield* Effect.forkDetach(refresh) } })',
      ),
      errors: [error('detach')],
    },
    { ...moduleTs, code: withEffect('task.pipe(Effect.forkDetach)'), errors: [error('detach')] },
    {
      ...moduleTs,
      code: withEffect(
        'Layer.effect(Svc, Effect.gen(function*() { yield* Effect.forkChild(loop); return Svc.of({}) }))',
      ),
      errors: [error('childInLayer')],
    },
    {
      ...moduleTs,
      code: withEffect(
        'Layer.effectDiscard(Effect.gen(function*() { yield* loop.pipe(Effect.forkChild) }).pipe(Effect.withSpan("boot")))',
      ),
      errors: [error('childInLayer')],
    },
    {
      ...moduleTs,
      code: withEffect(
        'Layer.effect(Svc, Effect.fn("Svc.make")(function*() { yield* Effect.forkChild(loop); return Svc.of({}) })())',
      ),
      errors: [error('childInLayer')],
    },
  ],
});
