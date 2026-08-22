import { preferClockSleepName } from '../../../../src/plugins/effect/rules/prefer-clock-sleep.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferClockSleepName, {
  valid: [
    { ...ts, code: withEffect('Effect.gen(function*() { yield* Effect.sleep("1 second") })') },
    { ...ts, code: withEffect('setTimeout(() => {}, 10)') },
    { ...testTs, code: withEffect('Effect.gen(function*() { setTimeout(() => {}, 10) })') },
    {
      ...ts,
      code: withEffect(
        'Effect.gen(function*() { const later = () => setTimeout(() => {}, 10); later() })',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Effect.gen(function*() { setTimeout(() => {}, 10) })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { setTimeout(() => {}, 10) })'),
      errors: [error('sleep')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn("wait")(function*() { setInterval(() => {}, 10) })'),
      errors: [error('sleep')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { setImmediate(() => {}) })'),
      errors: [error('sleep')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { globalThis.setTimeout(() => {}, 10) })'),
      errors: [error('sleep')],
    },
    {
      ...ts,
      code: withEffect('Effect.fnUntraced(function*() { setTimeout(() => {}, 10) })'),
      errors: [error('sleep')],
    },
    {
      ...ts,
      code: withEffect('Effect.gen(function*() { window.setTimeout(() => {}, 10) })'),
      errors: [error('sleep')],
    },
  ],
});
