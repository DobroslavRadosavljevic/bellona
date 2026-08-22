import { noYieldRefHandleName } from '../../../../src/plugins/effect/rules/no-yield-ref-handle.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noYieldRefHandleName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'import { Ref } from "effect";\nEffect.gen(function*() { const ref = yield* Ref.make(0); return yield* Ref.get(ref) })',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'import { Fiber } from "effect";\nEffect.gen(function*() { const fiber = yield* Effect.forkChild(Effect.void); return yield* Fiber.join(fiber) })',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'import { Deferred } from "effect";\nEffect.gen(function*() { const deferred = yield* Deferred.make<number>(); return yield* Deferred.await(deferred) })',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect(
        'import { Ref } from "effect";\nEffect.gen(function*() { const ref = yield* Ref.make(0); yield* ref })',
      ),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'import { Ref } from "effect";\nEffect.gen(function*() { const ref = yield* Ref.make(0); yield* ref })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Fiber } from "effect";\nEffect.gen(function*() { const fiber = yield* Effect.forkChild(Effect.void); yield* fiber })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Deferred } from "effect";\nEffect.gen(function*() { const deferred = yield* Deferred.make<number>(); yield* deferred })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Ref } from "effect";\nEffect.fn("use")(function*() { const ref = yield* Ref.make(0); yield* ref })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect('import { Ref } from "effect";\nEffect.gen(function*() { yield* Ref })'),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Ref } from "effect";\nEffect.gen(function*() { const ref = Ref.makeUnsafe(0); yield* ref })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Fiber } from "effect";\nEffect.gen(function*() { const fiber = yield* Effect.fork(Effect.void); yield* fiber })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Fiber } from "effect";\nEffect.fnUntraced(function*() { const fiber = yield* Effect.forkScoped(Effect.void); yield* fiber })',
      ),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect('import { Fiber } from "effect";\nEffect.gen(function*() { yield* Fiber })'),
      errors: [error('handle')],
    },
    {
      ...ts,
      code: withEffect(
        'import { Deferred } from "effect";\nEffect.gen(function*() { yield* Deferred })',
      ),
      errors: [error('handle')],
    },
  ],
});
