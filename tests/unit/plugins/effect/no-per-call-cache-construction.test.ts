import { noPerCallCacheConstructionName } from '../../../../src/plugins/effect/rules/no-per-call-cache-construction.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const IMPORT = "import { Cache, Effect, Layer, RcMap, ScopedCache } from 'effect';\n";

function code(body: string): string {
  return `${IMPORT}${body}`;
}

function perCall(api: string) {
  return { messageId: 'perCall' as const, data: { api } };
}

const IN_FN = code(`
const load = Effect.fn("load")(function* (id: string) {
  const cache = yield* Cache.make({ lookup: fetchUser, capacity: 100 });
  return yield* Cache.get(cache, id);
});
`);

runEffectRule(noPerCallCacheConstructionName, {
  valid: [
    // Layer construction runs once.
    {
      ...ts,
      code: code(`
class Users extends Context.Service<Users, Shape>()("a/Users") {
  static readonly layer = Layer.effect(Users, Effect.gen(function* () {
    const cache = yield* Cache.make({ lookup: fetchUser, capacity: 100 });
    const clients = yield* RcMap.make({ lookup: connect });
    const config = yield* Effect.cached(loadConfig);
    return Users.of({ find: Effect.fn("Users.find")(function* (id) { return yield* Cache.get(cache, id) }) });
  }));
}
`),
    },
    // Module level.
    { ...ts, code: code('export const cachedConfig = Effect.cached(loadConfig);') },
    {
      ...ts,
      code: code(
        'const users = Cache.makeWith({ lookup: fetchUser, timeToLive: () => "1 minute" });',
      ),
    },
    // A plain Effect.gen at module level is not per call.
    {
      ...ts,
      code: code(
        'const program = Effect.gen(function* () { const cache = yield* Cache.make({ lookup, capacity: 1 }) });',
      ),
    },
    // Other `make` calls are fine.
    {
      ...ts,
      code: code('const load = Effect.fn("load")(function* () { return yield* Queue.make() });'),
    },
    {
      ...ts,
      code: 'const load = Effect.fn("load")(function* () { return yield* Cache.make({ lookup }) });',
    },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: IN_FN },
    validWith(IN_FN, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: IN_FN, errors: [perCall('Cache.make')] },
    {
      ...ts,
      code: code(`
const load = Effect.fnUntraced(function* () {
  const keyed = yield* ScopedCache.makeWith({ lookup, timeToLive: () => "1 minute" });
  const ttl = yield* Effect.cachedWithTTL(fetchRates, "5 minutes");
  const once = yield* Effect.cachedInvalidateWithTTL(fetchRates, "5 minutes");
});
`),
      errors: [
        perCall('ScopedCache.makeWith'),
        perCall('Effect.cachedWithTTL'),
        perCall('Effect.cachedInvalidateWithTTL'),
      ],
    },
    // A service method runs for each call.
    {
      ...ts,
      code: code(`
class Rates extends Context.Service<Rates, Shape>()("a/Rates") {
  static readonly layer = Layer.effect(Rates, Effect.gen(function* () {
    return Rates.of({
      latest: () => Effect.cached(fetchRates).pipe(Effect.flatten),
      clients() { return RcMap.make({ lookup: connect }) },
    });
  }));
}
`),
      errors: [perCall('Effect.cached'), perCall('RcMap.make')],
    },
    {
      ...ts,
      code: `import * as Cache from 'effect/Cache';\nimport { Effect } from 'effect';\nconst f = Effect.fn("f")(function* () { yield* Effect.forEach(ids, () => Cache.make({ lookup, capacity: 1 })) });`,
      errors: [perCall('Cache.make')],
    },
  ],
});
