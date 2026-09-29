import { requireFnReturnAnnotationName } from '../../../../src/plugins/effect/rules/require-fn-return-annotation.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function annotation(name: string) {
  return { messageId: 'annotation' as const, data: { name } };
}

const EXPORTED = withEffect(
  'export const loadUser = Effect.fn("loadUser")(function* (id: string) { return yield* find(id) });',
);

runEffectRule(requireFnReturnAnnotationName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'export const loadUser = Effect.fn("loadUser")(function* (id: string): Effect.fn.Return<User, NotFound, Db> { return yield* find(id) });',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'export const parse = Effect.fnUntraced(function* (raw: string): Effect.fn.Return<number> { return Number(raw) });',
      ),
    },
    // Not exported.
    {
      ...ts,
      code: withEffect(
        'const loadUser = Effect.fn("loadUser")(function* (id: string) { return yield* find(id) });',
      ),
    },
    // Not top level.
    {
      ...ts,
      code: withEffect(
        'export function make() { const load = Effect.fn("load")(function* () { return 1 }); return load }',
      ),
    },
    // Service methods get their types from the service contract.
    {
      ...ts,
      code: withEffect(
        'export const layer = Layer.effect(Users, Effect.gen(function* () { return Users.of({ find: Effect.fn("Users.find")(function* (id) { return yield* repo.find(id) }) }) }));',
      ),
    },
    // Not a generator.
    { ...ts, code: withEffect('export const run = Effect.fn("run")(handler);') },
    { ...ts, code: 'export const loadUser = Effect.fn("loadUser")(function* () { return 1 });' },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: EXPORTED },
    validWith(EXPORTED, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: EXPORTED, errors: [annotation('loadUser')] },
    {
      ...ts,
      code: withEffect(
        'export const parse = Effect.fnUntraced(function* (raw: string) { return Number(raw) });',
      ),
      errors: [annotation('parse')],
    },
    {
      ...ts,
      code: withEffect(
        'const save = Effect.fn("save")(function* () { yield* write() }, Effect.withSpan("x"));\nexport { save };',
      ),
      errors: [annotation('save')],
    },
    {
      ...ts,
      code: withEffect('export default Effect.fn("main")(function* () { yield* run() });'),
      errors: [annotation('default')],
    },
    {
      ...ts,
      code: withEffect(
        'const one = Effect.fn(function* () { return 1 });\nexport { one as first };',
      ),
      errors: [annotation('one')],
    },
  ],
});
