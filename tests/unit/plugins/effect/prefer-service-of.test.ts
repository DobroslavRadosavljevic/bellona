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

    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, {}>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.fn("Database.make")(function*() {
    return Database.of({
      query: Effect.fn("Database.query")(function*() {
        return { id: "user" }
      }),
      transaction: Effect.fn("Database.transaction")(function*() {
        return yield* db.transaction(Effect.fn("Database.transaction.tx")(function*() {
          return { user, workspace }
        }))
      }),
      read() { return { ok: true } },
      arrow: () => { return { ok: true } },
    })
  })())
}
`),
    },
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, {}>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.succeed(Database.of({
    read() { return { ok: true } },
  })))
}
`),
    },
    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, {}>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.gen(function*() {
    function helper() { return { ok: true } }
    const rows = items.map((item) => { return { id: item.id } })
    return Database.of({ helper, rows })
  }))
}
`),
    },
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

    {
      ...ts,
      code: withEffect(`
class Database extends Context.Service<Database, {}>()("myapp/db/Database") {
  static readonly layer = Layer.effect(Database, Effect.fn("Database.make")(function*() {
    return { read() { return { ok: true } } }
  })())
}
`),
      errors: [error('of')],
    },
    {
      ...ts,
      code: `
import { Service } from "effect/Context";
import { effect as layerEffect } from "effect/Layer";
import { sync } from "effect/Effect";
class Database extends Service<Database, {}>()("myapp/db/Database") {
  static readonly layer = layerEffect(Database, sync(() => {
    return { read() { return { ok: true } } }
  }))
}
`,
      errors: [error('of')],
    },
  ],
});
