import { effectFunctionsInServicesName } from '../../../../src/plugins/effect/rules/effect-functions-in-services.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const file = { ...ts, filename: 'src/steps/tool-steps.ts' };

const IMPORTS =
  "import { Context, Effect, Schema } from 'effect';\nimport { Database } from '@app/database/connection/database.service';\n";

function code(body: string): string {
  return `${IMPORTS}${body}`;
}

function capability(name: string, service: string) {
  return { messageId: 'capability' as const, data: { name, service } };
}

runEffectRule(effectFunctionsInServicesName, {
  valid: [
    // Pure helpers.
    {
      ...file,
      code: code(
        'export const parse = Effect.fnUntraced(function*(input: unknown) { return yield* Schema.decodeUnknownEffect(Schema.String)(input) })',
      ),
    },
    { ...file, code: code('export function total(items: number[]) { return items.length }') },
    // Service methods live in the class.
    {
      ...file,
      code: code(`
export class Steps extends Context.Service<Steps, {}>()("a/Steps") {
  static readonly layer = Layer.effect(Steps, Effect.gen(function*() {
    const db = yield* Database
    return Steps.of({})
  }))
}
`),
    },
    // Service files, boundaries, and tests.
    {
      ...file,
      filename: 'src/steps/steps.service.ts',
      code: code('export const load = Effect.fn("load")(function*() { return yield* Database })'),
    },
    {
      ...file,
      filename: 'src/modules/chat/routes/list.ts',
      code: code('export const load = Effect.gen(function*() { return yield* Database })'),
    },
    {
      ...file,
      filename: 'src/server/runtime.ts',
      code: code('export const load = Effect.gen(function*() { return yield* Database })'),
    },
    {
      ...testTs,
      code: code('export const load = Effect.gen(function*() { return yield* Database })'),
    },
    // Not a service: a lowercase import, a type import, or an unknown package.
    {
      ...file,
      code: `import { Effect } from 'effect';\nimport { Database } from '@app/database';\nexport const load = Effect.gen(function*() { return yield* Database })`,
    },
    {
      ...file,
      code: `import { Effect } from 'effect';\nimport type { Database } from './database.service';\nexport const load = (db: Database) => db.query`,
    },
    // A function inside a class or inside another function is not module-level.
    {
      ...file,
      code: code(
        'export class Worker { run() { return Effect.gen(function*() { return yield* Database }) } }',
      ),
    },
    // Adapters that run the Effect at the edge.
    {
      ...file,
      code: code(
        'export function queryOptions() { return { queryFn: () => appRuntime.runPromise(Database.use((db) => db.load)) } }',
      ),
    },
    {
      ...file,
      code: code(
        'export function useChanges() { useEffect(() => { const fiber = Effect.runFork(Database.use((db) => db.watch)) }, []) }',
      ),
    },
    { ...file, code: NO_EFFECT },
    validWith(code('export const load = Effect.gen(function*() { return yield* Database })'), {
      ...file,
      options: [{ allow: ['tool-steps.ts'] }],
    }),
    validWith(code('export const load = Effect.gen(function*() { return yield* Database })'), {
      ...file,
      options: [{ boundaries: ['/steps/'] }],
    }),
  ],
  invalid: [
    {
      ...file,
      code: code(`
export const makeToolStepStore = Effect.fnUntraced(function*() {
  const db = yield* Database
  return { reserve: () => db }
})
`),
      errors: [capability('makeToolStepStore', 'Database')],
    },
    {
      ...file,
      code: code(
        'const load = Effect.fn("load")(function*(id: string) { const db = yield* Database; return id })',
      ),
      errors: [capability('load', 'Database')],
    },
    {
      ...file,
      code: code(
        'export function resolve(input: string) { return Effect.gen(function*() { const db = yield* Database; return input }) }',
      ),
      errors: [capability('resolve', 'Database')],
    },
    {
      ...file,
      code: code('export const count = () => Database.use((db) => db.count())'),
      errors: [capability('count', 'Database')],
    },
    {
      ...file,
      code: code(
        'export const program = Effect.gen(function*() { yield* Effect.service(Database) })',
      ),
      errors: [capability('program', 'Database')],
    },
    {
      // A service class in the same file.
      ...file,
      code: `import { Context, Effect } from 'effect';
class Clock extends Context.Reference<Clock>()("a/Clock", { defaultValue: () => 0 }) {}
export const now = Effect.gen(function*() { return yield* Clock })`,
      errors: [capability('now', 'Clock')],
    },
    {
      // `servicePackages`: PascalCase imports from these packages are services.
      ...file,
      code: `import { Effect } from 'effect';\nimport { IoRedis } from '@app/redis/io-redis';\nexport const ping = Effect.gen(function*() { const redis = yield* IoRedis; return redis })`,
      options: [{ servicePackages: ['@app/redis'] }],
      errors: [capability('ping', 'IoRedis')],
    },
    {
      ...file,
      code: `import { Effect } from 'effect';\nimport * as Db from './db.service';\nexport const load = Effect.gen(function*() { return yield* Db.Database })`,
      errors: [capability('load', 'Db.Database')],
    },
    {
      ...file,
      code: `import { Effect } from 'effect';\nimport { Mailer } from 'mailer';\nexport const send = Effect.gen(function*() { return yield* Mailer })`,
      options: [{ services: ['Mailer'] }],
      errors: [capability('send', 'Mailer')],
    },
  ],
});
