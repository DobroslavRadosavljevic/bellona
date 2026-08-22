import { noDateNowInEffectName } from '../../../../src/plugins/effect/rules/no-date-now-in-effect.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noDateNowInEffectName, {
  valid: [
    { ...ts, code: withEffect('const now = Clock.currentTimeMillis') },
    { ...ts, code: withEffect('const now = DateTime.now') },
    { ...ts, code: withEffect('const stamp = new Date("2024-01-01")') },
    { ...ts, code: withEffect('const stamp = new Date(0)') },
    { ...testTs, code: withEffect('const n = Date.now()') },
    {
      filename: 'src/__tests__/app.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('const n = Date.now()'),
    },
    {
      filename: 'src/app.spec.ts',
      languageOptions: ts.languageOptions,
      code: withEffect('const n = new Date()'),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('const n = Date.now()'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    { ...ts, code: withEffect('const n = Date.now()'), errors: [error('now')] },
    { ...ts, code: withEffect('const n = new Date()'), errors: [error('construct')] },
    { ...ts, code: withEffect('const n = globalThis.Date.now()'), errors: [error('now')] },
    { ...ts, code: withEffect('const n = new globalThis.Date()'), errors: [error('construct')] },
    { ...ts, code: withEffect('const n = window.Date.now()'), errors: [error('now')] },
    { ...ts, code: withEffect('const n = new window.Date()'), errors: [error('construct')] },
  ],
});
