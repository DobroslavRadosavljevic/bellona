import { maxServiceMethodsName } from '../../../../src/plugins/effect/rules/max-service-methods.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function members(count: number): string {
  return Array.from({ length: count }, (_, index) => `m${index}: () => Effect.Effect<void>`).join(
    '; ',
  );
}

function values(count: number): string {
  return Array.from({ length: count }, (_, index) => `m${index}: Effect.void`).join(', ');
}

function tooMany(name: string, count: number, max = 10) {
  return {
    messageId: 'tooMany' as const,
    data: { name, count: String(count), max: String(max) },
  };
}

runEffectRule(maxServiceMethodsName, {
  valid: [
    {
      ...ts,
      code: withEffect(`class Db extends Context.Service<Db, { ${members(10)} }>()("a/Db") {}`),
    },
    { ...ts, code: withEffect(`const Db = Context.Service<Db, { ${members(10)} }>("a/Db")`) },
    // The contract is not known here, and `.of` is small.
    {
      ...ts,
      code: withEffect(`
import type { DbShape } from "./db-shape"
class Db extends Context.Service<Db, DbShape>()("a/Db") {
  static readonly layer = Layer.succeed(Db, Db.of({ ${values(3)} }))
}
`),
    },
    // A spread hides the count.
    {
      ...ts,
      code: withEffect(
        `class Db extends Context.Service<Db, Shape>()("a/Db") { static readonly layer = Layer.succeed(Db, Db.of({ ...all })) }`,
      ),
    },
    {
      ...ts,
      code: withEffect(`class Db extends Context.Service<Db, { ${members(12)} }>()("a/Db") {}`),
      options: [{ max: 12 }],
    },
    { ...ts, code: `class Db extends Context.Service<Db, { ${members(12)} }>()("a/Db") {}` },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect(`class Db extends Context.Service<Db, { ${members(12)} }>()("a/Db") {}`), {
      ...ts,
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(`class Db extends Context.Service<Db, { ${members(11)} }>()("a/Db") {}`),
      errors: [tooMany('Db', 11)],
    },
    {
      ...ts,
      code: withEffect(
        `interface DbShape { ${members(12)} }\nexport class Db extends Context.Service<Db, DbShape>()("a/Db") {}`,
      ),
      errors: [tooMany('Db', 12)],
    },
    {
      ...ts,
      code: withEffect(
        `export type DbShape = { ${members(11)} }\nconst Db = Context.Service<Db, DbShape>("a/Db")`,
      ),
      errors: [tooMany('Db', 11)],
    },
    {
      ...ts,
      code: withEffect(`
class Db extends Context.Service<Db, Shape>()("a/Db") {
  static readonly layer = Layer.effect(Db, Effect.gen(function*() {
    return Db.of({ ${values(11)} })
  }))
}
`),
      errors: [tooMany('Db', 11)],
    },
    {
      ...ts,
      code: withEffect(`class Db extends Context.Service<Db, { ${members(4)} }>()("a/Db") {}`),
      options: [{ max: 3 }],
      errors: [tooMany('Db', 4, 3)],
    },
  ],
});
