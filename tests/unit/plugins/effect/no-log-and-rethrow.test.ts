import { noLogAndRethrowName } from '../../../../src/plugins/effect/rules/no-log-and-rethrow.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function logged(api: string) {
  return { messageId: 'logged' as const, data: { api } };
}

const IN_TRACED = withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* repo.find(id).pipe(Effect.tapError((error) => Effect.logError("Find failed", error)));
});
`);

runEffectRule(noLogAndRethrowName, {
  valid: [
    // A later step handles the error.
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* repo.find(id).pipe(
    Effect.tapError(() => Effect.logWarning("Cache read failed")),
    Effect.orElseSucceed(() => null),
  );
});
`),
    },
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* repo.find(id).pipe(
    Effect.tapError(() => Effect.logWarning("Part is invalid", { id })),
    Effect.mapError(() => new InvalidError()),
  );
});
`),
    },
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* repo.find(id).pipe(Effect.tapError(() => Effect.logWarning("x"))).pipe(Effect.ignore);
});
`),
    },
    // The handler does more than log.
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* repo.find(id).pipe(Effect.tapError(() => Metric.update(failures, 1)));
});
`),
    },
    // Not in a traced function.
    {
      ...ts,
      code: withEffect(`
const load = Effect.fnUntraced(function* (id: string) {
  return yield* repo.find(id).pipe(Effect.tapError(() => Effect.logError("Find failed")));
});
`),
    },
    {
      ...ts,
      code: withEffect('export const program = task.pipe(Effect.tapCause(Effect.logError))'),
    },
    {
      ...ts,
      code: 'const load = Effect.fn("x")(function* () { return yield* find().pipe(Effect.tapError(() => Effect.logError("x"))) });',
    },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: IN_TRACED },
    validWith(IN_TRACED, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: IN_TRACED, errors: [logged('Effect.tapError')] },
    // Piped after the traced function as an extra argument.
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(
  function* (id: string) { return yield* repo.find(id) },
  Effect.tapCause(Effect.logError),
);
`),
      errors: [logged('Effect.tapCause')],
    },
    {
      ...ts,
      code: withEffect(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tapErrorTag(repo.find(id), "NotFound", (error) => {
    return Effect.logInfo("Missing", error);
  });
});
`),
      errors: [logged('Effect.tapErrorTag')],
    },
    // Option: report outside traced functions too.
    {
      ...ts,
      code: withEffect('export const program = task.pipe(Effect.tapCause(Effect.logError))'),
      options: [{ tracedOnly: false }],
      errors: [logged('Effect.tapCause')],
    },
  ],
});
