import { requireFnOwnerPrefixName } from '../../../../src/plugins/effect/rules/require-fn-owner-prefix.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function service(body: string): string {
  return withEffect(`
class Mailer extends Context.Service<Mailer, {}>()("myapp/Mailer") {
  static readonly layer = Layer.effect(Mailer, Effect.gen(function*() {
    ${body}
    return Mailer.of({})
  }))
}
`);
}

function owner(spanName: string) {
  return { messageId: 'owner' as const, data: { spanName, owner: 'Mailer' } };
}

runEffectRule(requireFnOwnerPrefixName, {
  valid: [
    { ...ts, code: service('const send = Effect.fn("Mailer.send")(function*() {})') },
    { ...ts, code: service('const retry = Effect.fn("Mailer.send.retry")(function*() {})') },
    { ...ts, code: service('const step = Effect.fn(`Mailer.${name}`)(function*() {})') },
    // No name, or a name that is not a literal: `require-fn-name` owns those.
    { ...ts, code: service('const send = Effect.fn(function*() {})') },
    { ...ts, code: service('const send = Effect.fn(name)(function*() {})') },
    { ...ts, code: service('const send = Effect.fnUntraced(function*() {})') },
    // Outside a service class.
    { ...ts, code: withEffect('export const send = Effect.fn("send")(function*() {})') },
    {
      ...ts,
      code: withEffect('class Helper { run = Effect.fn("run")(function*() {}) }'),
    },
    { ...ts, code: NO_EFFECT },
    validWith(service('const send = Effect.fn("send")(function*() {})'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: service('const send = Effect.fn("send")(function*() {})'),
      errors: [owner('send')],
    },
    {
      ...ts,
      code: service('const send = Effect.fn("Mail.send")(function*() {})'),
      errors: [owner('Mail.send')],
    },
    {
      ...ts,
      code: service('const step = Effect.fn(`${name}.run`)(function*() {})'),
      errors: [owner('')],
    },
    {
      ...ts,
      code: `import { Context, Effect as E, Layer } from 'effect';
const Mailer = class extends Context.Service<never, {}>()("myapp/Mailer") {
  static readonly layer = Layer.succeed(this, { send: E.fn("deliver")(function*() {}) })
}`,
      errors: [owner('deliver')],
    },
  ],
});
