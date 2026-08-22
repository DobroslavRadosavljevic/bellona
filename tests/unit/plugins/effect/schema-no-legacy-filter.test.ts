import { schemaNoLegacyFilterName } from '../../../../src/plugins/effect/rules/schema-no-legacy-filter.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(schemaNoLegacyFilterName, {
  valid: [
    { ...ts, code: withEffect('Schema.String.check(Schema.isMinLength(1))') },
    { ...ts, code: withEffect('Schema.Number.check(Schema.isGreaterThan(0))') },
    { ...ts, code: withEffect('Schema.optionalKey(Schema.String)') },
    { ...ts, code: withEffect('[1,2,3].filter((n) => n > 0)') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Schema.String.filter((s) => s.length > 0)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Schema.String.filter((s) => s.length > 0)'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.filter((s: string) => s.length > 0)'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.optionalWith(Schema.String, { exact: true })'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.Number.positive()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.Number.negative()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.positive()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.nonEmptyString()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.Number.nonNegative()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.Number.nonPositive()'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.String.optionalWith({ exact: true })'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.String.pattern(/^[a-z]+$/)'),
      errors: [error('legacy')],
    },
    {
      ...ts,
      code: withEffect('Schema.String.pipe(Schema.filter((s) => s.length > 0))'),
      errors: [error('legacy')],
    },
  ],
});
