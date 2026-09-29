import { noServiceMakeFactoryName } from '../../../../src/plugins/effect/rules/no-service-make-factory.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function factory(name: string) {
  return { messageId: 'factory' as const, data: { name } };
}

runEffectRule(noServiceMakeFactoryName, {
  valid: [
    { ...ts, code: withEffect('Layer.effect(Db, Effect.gen(function*() { return Db.of({}) }))') },
    {
      ...ts,
      code: withEffect(
        'Layer.effect(Db, Effect.fn("Db.make")(function*() { return Db.of({}) })())',
      ),
    },
    { ...ts, code: withEffect('Layer.effect(Db, Effect.sync(() => Db.of({})))') },
    { ...ts, code: withEffect('Layer.effect(Db, Db.make)') },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, {}>()("a/Db", { make: Effect.succeed({}) }) { static readonly layer = Layer.effect(this, this.make) }',
      ),
    },
    { ...ts, code: withEffect('Layer.effect(Db, PgClient.make({ url }))') },
    {
      ...ts,
      code: `import { Layer } from 'effect';\nimport { gen } from 'effect/Effect';\nLayer.effect(Db, gen(function*() { return {} }))`,
    },
    { ...ts, code: withEffect('Layer.succeed(Db, makeDb())') },
    // An exported helper is shared with other modules. It is not a private service factory.
    {
      ...ts,
      code: withEffect(`
export const acquireRedis = Effect.fnUntraced(function*(name: string) { return {} })
class Redis extends Context.Service<Redis, {}>()("a/Redis") {
  static readonly layer = Layer.effect(Redis, acquireRedis("shared"))
}
`),
    },
    {
      ...ts,
      code: withEffect(
        'function acquire() { return Effect.succeed({}) }\nexport { acquire }\nLayer.effect(Db, acquire())',
      ),
    },
    { ...ts, code: withEffect('Layer.effect(Db)') },
    { ...ts, code: 'Layer.effect(Db, makeDb)' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Layer.effect(Db, makeDb)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    { ...ts, code: withEffect('Layer.effect(Db, makeDb)'), errors: [factory('makeDb')] },
    {
      ...ts,
      code: withEffect('Layer.effect(Db, makeDbService({ pool: 4 }))'),
      errors: [factory('makeDbService')],
    },
    {
      ...ts,
      code: withEffect(`
const make = Effect.gen(function*() { return Db.of({}) })
class Db extends Context.Service<Db, {}>()("a/Db") {
  static readonly layer = Layer.effect(Db, make)
}
`),
      errors: [factory('make')],
    },
    {
      ...ts,
      code: `import * as Layer from 'effect/Layer';\nLayer.effect(Db, build())`,
      errors: [factory('build')],
    },
  ],
});
