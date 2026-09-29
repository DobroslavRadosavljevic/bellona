import { preferFnUntracedInCallbacksName } from '../../../../src/plugins/effect/rules/prefer-fn-untraced-in-callbacks.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferFnUntracedInCallbacksName, {
  valid: [
    { ...ts, code: withEffect('Effect.forEach(items, Effect.fnUntraced(function*(item) {}))') },
    { ...ts, code: withEffect('export const load = Effect.fn("load")(function*() {})') },
    { ...ts, code: withEffect('Svc.of({ list: Effect.fn("Svc.list")(function*() {}) })') },
    // The applied function is called, not passed.
    {
      ...ts,
      code: withEffect('Layer.effect(Svc, Effect.fn("Svc.make")(function*() { return {} })())'),
    },
    {
      ...ts,
      code: withEffect(
        'const load = Effect.fn("load")(function*() {})\nEffect.forEach(items, load)',
      ),
    },
    // Option: skip named callees.
    validWith(withEffect('HttpRouter.add("GET", "/", Effect.fn("handler")(function*() {}))'), {
      ...ts,
      options: [{ callees: ['HttpRouter.add'] }],
    }),
    validWith(withEffect('router.get("/", Effect.fn("handler")(function*() {}))'), {
      ...ts,
      options: [{ callees: ['get'] }],
    }),
    // Default `callees`: a CLI handler runs once per process.
    {
      ...ts,
      code: withEffect('Command.make("adjust", {}, Effect.fn("adjust.run")(function*() {}))'),
    },
    {
      ...ts,
      code: withEffect('cmd.pipe(Command.withHandler(Effect.fn("adjust.run")(function*() {})))'),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.forEach(items, Effect.fn("each")(function*(item) {}))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.forEach(items, Effect.fn("each")(function*(item) {}))'),
      errors: [error('untraced')],
    },
    {
      ...ts,
      code: withEffect('stream.pipe(Stream.mapEffect(Effect.fn("map")(function*(x) {})))'),
      errors: [error('untraced')],
    },
    {
      ...ts,
      code: withEffect('db.transaction(Effect.fn("tx")(function*(tx) {}))'),
      errors: [error('untraced')],
    },
    {
      ...ts,
      code: withEffect(
        'load.pipe(Effect.catchTag("NotFound", Effect.fn("recover")((e) => Effect.succeed(null))))',
      ),
      errors: [error('untraced')],
    },
    {
      ...ts,
      code: withEffect('new Worker(Effect.fn("work")(function*() {}))'),
      errors: [error('untraced')],
    },
    {
      ...ts,
      code: withEffect('router.get("/", Effect.fn("handler")(function*() {}))'),
      options: [{ callees: ['post'] }],
      errors: [error('untraced')],
    },
    {
      // A custom `callees` list replaces the default list.
      ...ts,
      code: withEffect('Command.make("adjust", {}, Effect.fn("adjust.run")(function*() {}))'),
      options: [{ callees: ['post'] }],
      errors: [error('untraced')],
    },
  ],
});
