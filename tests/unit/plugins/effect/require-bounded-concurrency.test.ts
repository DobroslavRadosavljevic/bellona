import { requireBoundedConcurrencyName } from '../../../../src/plugins/effect/rules/require-bounded-concurrency.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function unbounded(api: string) {
  return { messageId: 'unbounded' as const, data: { api } };
}

runEffectRule(requireBoundedConcurrencyName, {
  valid: [
    { ...ts, code: withEffect('Effect.all([a, b, c], { concurrency: "unbounded" })') },
    { ...ts, code: withEffect('Effect.all({ user, team }, { concurrency: "unbounded" })') },
    {
      ...ts,
      code: withEffect('const jobs = [a, b]\nEffect.all(jobs, { concurrency: "unbounded" })'),
    },
    {
      ...ts,
      code: withEffect('Effect.forEach(["a", "b"], load, { concurrency: "unbounded" })'),
    },
    {
      ...ts,
      code: withEffect('[a, b].pipe(Effect.forEach(load, { concurrency: "unbounded" }))'),
    },
    {
      ...ts,
      code: withEffect('Stream.mergeAll({ concurrency: "unbounded" })([left, right])'),
    },
    { ...ts, code: withEffect('Effect.forEach(ids, load, { concurrency: 8 })') },
    {
      ...ts,
      code: withEffect(
        'const clients = { a, b, c }\nEffect.forEach(Object.values(clients), close, { concurrency: "unbounded" })',
      ),
    },
    { ...ts, code: withEffect('Effect.all(tasks)') },
    { ...ts, code: 'Effect.forEach(ids, load, { concurrency: "unbounded" })' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.forEach(ids, load, { concurrency: "unbounded" })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'Effect.forEach(Object.values(clients), close, { concurrency: "unbounded" })',
      ),
      errors: [unbounded('Effect.forEach')],
    },
    {
      ...ts,
      code: withEffect('Effect.forEach(ids, load, { concurrency: "unbounded" })'),
      errors: [unbounded('Effect.forEach')],
    },
    {
      ...ts,
      code: withEffect('Effect.all(ids.map(load), { concurrency: "unbounded" })'),
      errors: [unbounded('Effect.all')],
    },
    {
      ...ts,
      code: withEffect('Effect.all([...tasks], { concurrency: "unbounded" })'),
      errors: [unbounded('Effect.all')],
    },
    {
      ...ts,
      code: withEffect('rows.pipe(Effect.forEach(load, { concurrency: "unbounded" }))'),
      errors: [unbounded('Effect.forEach')],
    },
    {
      ...ts,
      code: withEffect('stream.pipe(Stream.mapEffect(load, { concurrency: "unbounded" }))'),
      errors: [unbounded('Stream.mapEffect')],
    },
    {
      ...ts,
      code: withEffect('Stream.mergeAll(streams, { concurrency: "unbounded" })'),
      errors: [unbounded('Stream.mergeAll')],
    },
  ],
});
