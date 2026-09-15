import { preferDecodeUnknownEffectName } from '../../../../src/plugins/effect/rules/prefer-decode-unknown-effect.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function decoder(name: string, replacement: string) {
  return { messageId: 'decoder' as const, data: { name, replacement } };
}

runEffectRule(preferDecodeUnknownEffectName, {
  valid: [
    { ...ts, code: withEffect('Schema.decodeUnknownEffect(Schema.String)') },
    { ...ts, code: withEffect('Schema.decodeUnknownSync(Schema.String)("x")') },
    { ...ts, code: withEffect('Schema.decodeUnknownExit(Schema.String)("x")') },
    { ...ts, code: withEffect('Schema.decodeEffect(Schema.String)') },
    {
      ...ts,
      code: withEffect('Schema.decode({ decode: (n) => n, encode: (n) => n })'),
    },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Schema.decodeUnknown(Schema.String)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Schema.decodeUnknown(Schema.String)'),
      errors: [decoder('decodeUnknown', 'Schema.decodeUnknownEffect')],
    },
    {
      ...ts,
      code: withEffect('Schema.encodeUnknown(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema.decodeUnknownEither(Schema.String)'),
      errors: [decoder('decodeUnknownEither', 'Schema.decodeUnknownExit')],
    },
    {
      ...ts,
      code: withEffect('Schema.encodeUnknownEither(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema.decodeEither(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema.encodeEither(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema["decodeUnknown"](Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema.decode(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect('Schema.encode(Schema.String)'),
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: `import { decodeUnknown, String } from 'effect/Schema';\ndecodeUnknown(String)`,
      errors: [error('decoder')],
    },
    {
      ...ts,
      code: withEffect(`
const parse = Schema.decodeUnknown(Schema.String)
const roundTrip = Schema.encodeUnknownEither(Schema.Number)
`),
      errors: [
        decoder('decodeUnknown', 'Schema.decodeUnknownEffect'),
        decoder('encodeUnknownEither', 'Schema.encodeUnknownExit'),
      ],
    },
  ],
});
