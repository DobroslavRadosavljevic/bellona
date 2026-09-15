import { noV3EffectApisName } from '../../../../src/plugins/effect/rules/no-v3-effect-apis.ts';
import { error, validWith } from '../../lib/cases.ts';
import { EFFECT_NS_IMPORT, NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function renamed(api: string, replacement: string) {
  return { messageId: 'renamed' as const, data: { api, replacement } };
}

runEffectRule(noV3EffectApisName, {
  valid: [
    { ...ts, code: withEffect('Effect.catch((e) => Effect.succeed(e))') },
    { ...ts, code: withEffect('Effect.catchCause((c) => Effect.succeed(c))') },
    { ...ts, code: withEffect('Effect.callback((resume) => { resume(Effect.void) })') },
    { ...ts, code: withEffect('Effect.result(Effect.succeed(1))') },
    { ...ts, code: withEffect('Effect.andThen(Effect.succeed(1), Effect.succeed(2))') },
    { ...ts, code: withEffect('Effect.forkChild(Effect.void)') },
    { ...ts, code: withEffect('Effect.forkDetach(Effect.void)') },
    { ...ts, code: withEffect('Effect.forkScoped(Effect.void)') },
    { ...ts, code: withEffect('Layer.effect(Context.Service("a/b"), Effect.succeed({}))') },
    { ...ts, code: 'other.catchAll(x)' },
    { ...ts, code: NO_EFFECT },
    { ...ts, code: withEffect('async function go() { return 1 }') },
    { ...ts, code: withEffect('Stream.callback((emit) => { emit.end() })') },
    { ...ts, code: withEffect('Scope.provide(Effect.void, scope)') },
    { ...ts, code: withEffect('Predicate.isObject(x)') },
    { ...ts, code: withEffect('Predicate.isObjectKeyword(x)') },
    { ...ts, code: withEffect('Predicate.isNullish(x)') },
    validWith(withEffect('Effect.catchAll((e) => e)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.catchAll((e) => Effect.succeed(e))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchAllCause((c) => Effect.succeed(c))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchAllDefect((d) => Effect.succeed(d))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchSome((e) => e)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchSomeCause((c) => c)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchSomeDefect((d) => d)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.async((resume) => { resume(Effect.void) })'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.either(Effect.succeed(1))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.zipRight(Effect.void, Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.zipLeft(Effect.void, Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.fork(Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.forkDaemon(Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.forkAll([Effect.void])'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.forkWithErrorHandler(Effect.void, () => {})'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Layer.scoped(Context.Service("a/b"), Effect.succeed({}))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Layer.scopedDiscard(Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.succeed(1).pipe(Effect.catchAll(() => Effect.void))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect["catchAll"](() => Effect.void)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.catchAll(() => Effect.void)', EFFECT_NS_IMPORT),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: `import { catchAll } from 'effect/Effect';\ncatchAll(() => 1)`,
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: `import { Effect as E } from 'effect';\nE.fork(E.void)`,
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: `import * as E from 'effect';\nE.Effect.catchAll(() => E.Effect.void)`,
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Effect.asyncEffect((resume) => { resume(Effect.void) })'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Layer.scopedContext(Effect.succeed({}))'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Stream.async((emit) => { emit.end() })'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Layer.catchAll(Layer.empty, () => Layer.empty)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Scope.extend(Effect.void, scope)'),
      errors: [error('renamed')],
    },
    {
      ...ts,
      code: withEffect('Predicate.isRecord(x)'),
      errors: [renamed('Predicate.isRecord', 'Predicate.isObject')],
    },
    {
      ...ts,
      code: withEffect('Predicate.isNullable(x)'),
      errors: [renamed('Predicate.isNullable', 'Predicate.isNullish')],
    },
    {
      ...ts,
      code: withEffect('Predicate.isNotNullable(x)'),
      errors: [renamed('Predicate.isNotNullable', 'Predicate.isNotNullish')],
    },
    {
      ...ts,
      code: withEffect('Predicate.isReadonlyRecord(x)'),
      errors: [renamed('Predicate.isReadonlyRecord', 'Predicate.isReadonlyObject')],
    },
    {
      ...ts,
      code: `import { isRecord } from 'effect/Predicate';\nisRecord(x)`,
      errors: [renamed('Predicate.isRecord', 'Predicate.isObject')],
    },
    {
      ...ts,
      code: `import { isNullable } from 'effect/Predicate';\nisNullable(x)`,
      errors: [renamed('Predicate.isNullable', 'Predicate.isNullish')],
    },
    {
      ...ts,
      code: `import * as Predicate from 'effect/Predicate';\nPredicate.isRecord(value)`,
      errors: [renamed('Predicate.isRecord', 'Predicate.isObject')],
    },
    {
      ...ts,
      code: `import * as E from 'effect';\nE.Predicate.isRecord(value)`,
      errors: [renamed('Predicate.isRecord', 'Predicate.isObject')],
    },
    {
      ...ts,
      code: withEffect(`
const program = Effect.fail("boom").pipe(Effect.catchAll((e) => Effect.succeed(e)))
Effect.fork(program)
if (Predicate.isRecord(input) && Predicate.isNullable(input.x)) { input }
`),
      errors: [
        renamed('Effect.catchAll', 'Effect.catch'),
        renamed('Effect.fork', 'Effect.forkChild'),
        renamed('Predicate.isRecord', 'Predicate.isObject'),
        renamed('Predicate.isNullable', 'Predicate.isNullish'),
      ],
    },
    {
      ...ts,
      code: "import * as Effect from 'effect';\nEffect.catchAll(() => Effect.void)",
      errors: [error('renamed')],
    },
  ],
});
