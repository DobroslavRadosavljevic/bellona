import { requireDefectCauseName } from '../../../../src/plugins/effect/rules/require-defect-cause.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function defect(name: string) {
  return { messageId: 'defect' as const, data: { name } };
}

runEffectRule(requireDefectCauseName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { cause: Schema.Defect() }) {}',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { cause: Schema.optional(Schema.Defect()) }) {}',
      ),
    },
    // Other fields, and schemas that are not errors.
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { payload: Schema.Unknown }) {}',
      ),
    },
    { ...ts, code: withEffect('const Event = Schema.Struct({ cause: Schema.Unknown })') },
    {
      ...ts,
      code: 'class DbError extends Schema.TaggedError<DbError>()("DbError", { cause: Schema.Unknown }) {}',
    },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { cause: Schema.Unknown }) {}',
      ),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { message: Schema.String, cause: Schema.Unknown }) {}',
      ),
      errors: [defect('Unknown')],
    },
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.TaggedError<DbError>()("DbError", { cause: Schema.optionalKey(Schema.Any) }) {}',
      ),
      errors: [defect('Any')],
    },
    {
      ...ts,
      code: withEffect(
        'class DbError extends Schema.Error<DbError>("DbError")(Schema.Struct({ cause: Schema.NullOr(Schema.Unknown) })) {}',
      ),
      errors: [defect('Unknown')],
    },
    {
      ...ts,
      code: `import { TaggedError, Unknown } from 'effect/Schema';\nclass DbError extends TaggedError<DbError>()("DbError", { cause: Unknown }) {}`,
      errors: [defect('Unknown')],
    },
  ],
});
