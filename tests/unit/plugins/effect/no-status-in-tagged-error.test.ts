import { noStatusInTaggedErrorName } from '../../../../src/plugins/effect/rules/no-status-in-tagged-error.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function status(key: string) {
  return { messageId: 'status' as const, data: { key } };
}

runEffectRule(noStatusInTaggedErrorName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", { id: Schema.String }) {}',
      ),
    },
    // A status that an upstream API sent is data.
    {
      ...ts,
      code: withEffect(
        'class PolarError extends Schema.TaggedError<PolarError>()("PolarError", { status: Schema.NullOr(Schema.Number) }) {}',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'class SendError extends Schema.TaggedError<SendError>()("SendError", { statusCode: Schema.optionalKey(Schema.Number) }) {}',
      ),
    },
    {
      ...ts,
      code: withEffect('class Boom extends Data.TaggedError("Boom")<{ status: number }> {}'),
    },
    // Not an error class.
    { ...ts, code: withEffect('const Reply = Schema.Struct({ status: Schema.Literal(200) })') },
    {
      ...ts,
      code: withEffect(
        'class Job extends Schema.Class<Job>("Job")({ status: Schema.Literal(1) }) {}',
      ),
    },
    { ...ts, code: withEffect('class Reply { readonly status = 200 }') },
    { ...ts, code: 'class Boom extends Data.TaggedError("Boom")<{ status: 404 }> {}' },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect(
        'class Boom extends Schema.TaggedError<Boom>()("Boom", { status: Schema.Literal(500) }) {}',
      ),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", { status: Schema.Literal(404) }) {}',
      ),
      errors: [status('status')],
    },
    {
      ...ts,
      code: withEffect(
        'class Boom extends Schema.TaggedError<Boom>()("Boom", Schema.Struct({ statusCode: Schema.Literal(500).pipe(Schema.withConstructorDefault(() => Option.some(500))), "httpStatus": Schema.tag(502) })) {}',
      ),
      errors: [status('statusCode'), status('httpStatus')],
    },
    {
      ...ts,
      code: withEffect(
        'class Boom extends Schema.Error<Boom>("Boom")({ message: Schema.String }) { readonly status = 500 }',
      ),
      errors: [status('status')],
    },
    {
      ...ts,
      code: withEffect(
        'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {}) { static readonly httpStatus = 404 }',
      ),
      errors: [status('httpStatus')],
    },
    {
      ...ts,
      code: withEffect('class Boom extends Data.TaggedError("Boom")<{ status: 404 }> {}'),
      errors: [status('status')],
    },
    {
      ...ts,
      code: withEffect('class Boom extends Data.Error<{ readonly httpStatus: 500 }> {}'),
      errors: [status('httpStatus')],
    },
  ],
});
