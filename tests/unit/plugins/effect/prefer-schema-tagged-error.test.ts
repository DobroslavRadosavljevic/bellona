import { preferSchemaTaggedErrorName } from '../../../../src/plugins/effect/rules/prefer-schema-tagged-error.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferSchemaTaggedErrorName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'export class Boom extends Schema.TaggedError<Boom>()("Boom", { message: Schema.String }) {}',
      ),
    },
    { ...ts, code: withEffect('class Helper {}') },
    { ...testTs, code: withEffect('class Boom extends Error {}') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('class Boom extends Error {}'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    { ...ts, code: withEffect('class Boom extends Error {}'), errors: [error('errorClass')] },
    {
      ...ts,
      code: withEffect('class Boom extends Data.TaggedError("Boom")<{ message: string }>() {}'),
      errors: [error('dataTagged')],
    },
    {
      ...ts,
      code: withEffect('const Boom = Data.TaggedError("Boom")'),
      errors: [error('dataTagged')],
    },
    {
      ...ts,
      code: withEffect('Effect.fail(new Error("x"))'),
      errors: [error('failError')],
    },
    {
      ...ts,
      code: withEffect('const Boom = class extends Error {}'),
      errors: [error('errorClass')],
    },
    {
      ...ts,
      code: `import { TaggedError } from 'effect/Data';\nconst Boom = TaggedError("Boom")`,
      errors: [error('dataTagged')],
    },
  ],
});
