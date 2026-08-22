import { schemaUnionArrayName } from '../../../../src/plugins/effect/rules/schema-union-array.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, SCHEMA_NS_IMPORT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(schemaUnionArrayName, {
  valid: [
    { ...ts, code: withEffect('Schema.Union([Schema.String, Schema.Number])') },
    { ...ts, code: withEffect('Schema.Union([Schema.String, Schema.Number], { mode: "oneOf" })') },
    { ...ts, code: withEffect('const members = [Schema.String]; Schema.Union(members)') },
    { ...ts, code: withEffect('Schema.Literal("ok")') },
    { ...ts, code: withEffect('Schema.Literals(["a", "b"])') },
    { ...ts, code: withEffect('Schema.Tuple([Schema.String, Schema.Number])') },
    { ...ts, code: withEffect('Schema.TemplateLiteral([Schema.String, Schema.Literal("!")])') },
    { ...ts, code: withEffect('const items = [Schema.String]; Schema.Tuple(items)') },
    { ...ts, code: withEffect('const parts = [Schema.String]; Schema.TemplateLiteral(parts)') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Schema.Union(Schema.String, Schema.Number)'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('Schema.Union(Schema.String, Schema.Number)'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.Union(Schema.String)'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.Literal("a", "b")'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.Tuple(Schema.String, Schema.Number)'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.TemplateLiteral(Schema.String, Schema.Literal("x"))'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.Union(Schema.String, Schema.Number)', SCHEMA_NS_IMPORT),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('const A = Schema.String; const B = Schema.Number; Schema.Union(A, B)'),
      errors: [error('array')],
    },
    {
      ...ts,
      code: withEffect('Schema.Tuple(A, B)'),
      errors: [error('array')],
    },
  ],
});
