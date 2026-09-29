import { noDuplicateLayerConstructionName } from '../../../../src/plugins/effect/rules/no-duplicate-layer-construction.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function duplicate(call: string, line: number) {
  return { messageId: 'duplicate' as const, data: { call, line: String(line) } };
}

// `withEffect` adds one import line, so the first user line is line 2.
const TWO_POOLS =
  withEffect(`const Users = UsersRepo.layer.pipe(Layer.provide(PgClient.layer({ url })));
const Posts = PostsRepo.layer.pipe(Layer.provide(PgClient.layer({ url })));`);

runEffectRule(noDuplicateLayerConstructionName, {
  valid: [
    // One constant, used twice.
    {
      ...ts,
      code: withEffect(`const Pg = PgClient.layer({ url });
const Users = UsersRepo.layer.pipe(Layer.provide(Pg));
const Posts = PostsRepo.layer.pipe(Layer.provide(Pg));`),
    },
    // Different arguments.
    {
      ...ts,
      code: withEffect(
        'const a = PgClient.layer({ url: a });\nconst b = PgClient.layer({ url: b });',
      ),
    },
    // A layer value, not a call, is memoized by identity.
    {
      ...ts,
      code: withEffect('const a = Layer.provide(Db.layer);\nconst b = Layer.provide(Db.layer);'),
    },
    // Combinators do not build resources.
    { ...ts, code: withEffect('const a = Layer.mergeAll(A, B);\nconst b = Layer.mergeAll(A, B);') },
    // No arguments.
    { ...ts, code: withEffect('const a = makeLayer();\nconst b = makeLayer();') },
    { ...ts, code: 'const a = PgClient.layer({ url });\nconst b = PgClient.layer({ url });' },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: TWO_POOLS },
    validWith(TWO_POOLS, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: TWO_POOLS, errors: [duplicate('PgClient.layer({url})', 2)] },
    {
      ...ts,
      code: withEffect(`const a = Layer.effect(Db, makeDb);
const b = Layer.effect(Db,
  makeDb);
const c = Layer.effect(Db, makeDb);`),
      errors: [duplicate('Layer.effect(Db,makeDb)', 2), duplicate('Layer.effect(Db,makeDb)', 2)],
    },
    {
      ...ts,
      code: withEffect(
        'const a = redisLayer("cache");\nconst b = Redis.makeLayer(opts);\nconst c = redisLayer("cache");\nconst d = Redis.makeLayer(opts);',
      ),
      errors: [duplicate('redisLayer("cache")', 2), duplicate('Redis.makeLayer(opts)', 3)],
    },
    {
      ...ts,
      code: withEffect(
        'const a = Http.layerConfig({ port: 1 });\nconst b = Http.layerConfig({ port: 1 });',
      ),
      errors: [duplicate('Http.layerConfig({port:1})', 2)],
    },
  ],
});
