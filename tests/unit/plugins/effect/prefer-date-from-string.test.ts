import { preferDateFromStringName } from '../../../../src/plugins/effect/rules/prefer-date-from-string.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferDateFromStringName, {
  valid: [
    { ...ts, code: withEffect('Schema.DateFromString') },
    { ...ts, code: withEffect('Schema.DateFromMillis') },
    { ...ts, code: withEffect('Schema.DateTimeUtcFromString') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Schema.Date'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    { ...ts, code: withEffect('Schema.Date'), errors: [error('date')] },
    {
      ...ts,
      code: withEffect('Schema.Struct({ createdAt: Schema.Date })'),
      errors: [error('date')],
    },
    { ...ts, code: withEffect('Schema.DateFromSelf'), errors: [error('fromSelf')] },
    { ...ts, code: withEffect('Schema.DateFromNumber'), errors: [error('fromNumber')] },
    {
      ...ts,
      code: `import { Date } from 'effect/Schema';\nexport const CreatedAt = Date`,
      errors: [error('date')],
    },
    {
      ...ts,
      code: `import { Schema as S } from 'effect';\nS.Date`,
      errors: [error('date')],
    },
    {
      ...ts,
      code: withEffect('Schema["Date"]'),
      errors: [error('date')],
    },
  ],
});
