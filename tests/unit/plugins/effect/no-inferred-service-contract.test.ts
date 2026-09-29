import { noInferredServiceContractName } from '../../../../src/plugins/effect/rules/no-inferred-service-contract.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function inferred(type: string) {
  return { messageId: 'inferred' as const, data: { type } };
}

const INFERRED_CLASS = withEffect(
  'class Db extends Context.Service<Db, Effect.Success<typeof makeDb>>()("a/Db") {}',
);

runEffectRule(noInferredServiceContractName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { readonly query: (sql: string) => Effect.Effect<number> }>()("a/Db") {}',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'interface DbShape { readonly query: () => Effect.Effect<number> }\nclass Db extends Context.Service<Db, DbShape>()("a/Db") {}',
      ),
    },
    // A third-party client type is not a local factory.
    {
      ...ts,
      code: withEffect(
        'class Sdk extends Context.Service<Sdk, ReturnType<typeof createClient>>()("a/Sdk") {}',
      ),
    },
    // A type alias that is not used as a service shape.
    {
      ...ts,
      code: withEffect('type Built = Effect.Success<typeof makeDb>\nconst value: Built = load()'),
    },
    {
      ...ts,
      code: 'class Db extends Context.Service<Db, Effect.Success<typeof makeDb>>()("a/Db") {}',
    },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: INFERRED_CLASS },
    validWith(INFERRED_CLASS, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: INFERRED_CLASS, errors: [inferred('Effect.Success<typeof makeDb>')] },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, Effect.Success<ReturnType<typeof build>>>()("a/Db") {}',
      ),
      errors: [inferred('Effect.Success<ReturnType<typeof build>>')],
    },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, ReturnType<typeof makeDbService>>()("a/Db") {}',
      ),
      errors: [inferred('ReturnType<typeof makeDbService>')],
    },
    {
      ...ts,
      code: withEffect(
        'type DbShape = Effect.Success<typeof make>\nclass Db extends Context.Service<Db, DbShape>()("a/Db") {}',
      ),
      errors: [inferred('Effect.Success<typeof make>')],
    },
    {
      ...ts,
      code: withEffect(
        'export type DbShape = Omit<Effect.Success<typeof make>, "close">\nexport class Db extends Context.Service<Db, DbShape>()("a/Db") {}',
      ),
      errors: [inferred('Effect.Success<typeof make>')],
    },
    {
      ...ts,
      code: withEffect('const Db = Context.Service<Effect.Success<typeof makeDb>>("a/Db")'),
      errors: [inferred('Effect.Success<typeof makeDb>')],
    },
    {
      ...ts,
      code: `import * as Context from 'effect/Context';\nimport type * as Effect from 'effect/Effect';\nclass Db extends Context.Service<Db, Effect.Success<typeof makeDb>>()("a/Db") {}`,
      errors: [inferred('Effect.Success<typeof makeDb>')],
    },
  ],
});
