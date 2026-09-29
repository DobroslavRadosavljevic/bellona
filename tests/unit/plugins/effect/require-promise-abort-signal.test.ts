import { requirePromiseAbortSignalName } from '../../../../src/plugins/effect/rules/require-promise-abort-signal.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function signal(api: string) {
  return { messageId: 'signal' as const, data: { api } };
}

runEffectRule(requirePromiseAbortSignalName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: (signal) => fetch(url, { signal }), catch: (cause) => cause })',
      ),
    },
    { ...ts, code: withEffect('Effect.tryPromise((signal) => fetch(url, { signal }))') },
    { ...ts, code: withEffect('Effect.promise((signal) => fetch(url, { signal }))') },
    // No signal API in the body.
    { ...ts, code: withEffect('Effect.tryPromise(() => fs.readFile(path))') },
    { ...ts, code: withEffect('Effect.tryPromise({ try: () => db.query(sql), catch: (e) => e })') },
    // A nested function is not the Promise function.
    {
      ...ts,
      code: withEffect('Effect.tryPromise(() => Promise.resolve(() => fetch(url)))'),
    },
    { ...ts, code: withEffect('Effect.tryPromise(load)') },
    { ...ts, code: 'Effect.tryPromise(() => fetch(url))' },
    { ...ts, code: NO_EFFECT },
    // Option: a custom API list replaces the default.
    validWith(withEffect('Effect.tryPromise(() => fetch(url))'), {
      ...ts,
      options: [{ apis: ['ky.get'] }],
    }),
    validWith(withEffect('Effect.tryPromise(() => fetch(url))'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.tryPromise(() => fetch(url))'),
      errors: [signal('fetch')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: async () => { const res = await fetch(url); return res.json() }, catch: (e) => e })',
      ),
      errors: [signal('fetch')],
    },
    {
      ...ts,
      code: withEffect('Effect.promise(() => globalThis.fetch(url))'),
      errors: [signal('fetch')],
    },
    {
      ...ts,
      code: withEffect(
        'Effect.tryPromise({ try: () => fetch(url, { signal: AbortSignal.timeout(5000) }), catch: (e) => e })',
      ),
      errors: [signal('fetch')],
    },
    {
      ...ts,
      code: withEffect('Effect.tryPromise(function () { return ky.get(url) })'),
      options: [{ apis: ['ky.get'] }],
      errors: [signal('ky.get')],
    },
  ],
});
