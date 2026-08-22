import { preferServiceOfName } from '../../../../src/plugins/effect/rules/prefer-service-of.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferServiceOfName, {
  valid: [
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, { query(sql: string): string }>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.gen(function*() {
    return Database.of({ query: (sql) => sql })
  }))
}
`),
    },
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, { query(sql: string): string }>()("myapp/db/Database") {
  query() { return { ok: true } }
}
`),
    },
    {
      ...testTs,
      code: withEffect(
        'class X extends Context.Service<X, {}>()("a/b") { static readonly layer = Layer.effect(X, Effect.gen(function*() { return {} })) }',
      ),
    },
    { ...ts, code: NO_EFFECT },
    {
      ...ts,
      code: withEffect(`
class Helper {
  static readonly layer = Layer.effect(Context.Service("a/b"), Effect.gen(function*() {
    return { query: () => "1" }
  }))
}
`),
    },
    validWith(
      withEffect(
        'class Database extends Context.Service<Database, {}>()("a/b") { static readonly layer = Layer.effect(Database, Effect.gen(function*() { return {} })) }',
      ),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, { query(sql: string): string }>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.gen(function*() {
    return { query: (sql: string) => sql }
  }))
}
`),
      errors: [error('of')],
    },
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, { query(sql: string): string }>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.succeed({ query: (sql: string) => sql }))
}
`),
      errors: [error('of')],
    },
  ],
});
