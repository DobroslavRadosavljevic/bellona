import { zodSchemaNamingName } from '../../../../src/plugins/zod/rules/zod-schema-naming.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { withZod, ZOD_V4_IMPORT } from './fixtures.ts';
import { runZodRule } from './harness.ts';

runZodRule(zodSchemaNamingName, {
  valid: [
    { code: withZod('export const UserSchema = z.object({ id: z.string() });') },
    { code: withZod('export const EmailSchema = z.email();') },
    { code: withZod('export const WhenSchema = z.iso.datetime();') },
    { code: withZod('export const CountSchema = z.int();') },
    { code: withZod('export const CoercedSchema = z.coerce.number();') },
    { code: withZod('export const CustomSchema = z.custom<number>((value) => value > 0);') },
    { code: withZod('export const StrictSchema = z.strictObject({ id: z.string() });') },
    { code: withZod('export const LooseSchema = z.looseObject({ id: z.string() });') },
    { code: withZod('const userSchema = z.object({ id: z.string() });') },
    { code: withZod('export const count = 1;') },
    { code: withZod('export const UserInput = UserSchema.pick({ id: true });') },
    { code: withZod('export const Extended = UserSchema.extend({ name: z.string() });') },
    { code: withZod('export const makeUserSchema = () => z.object({});') },
    { code: withZod('export function build() { return z.object({}); }') },
    { code: withZod('export { UserSchema };') },
    { code: 'export const user = z.object({});' },
    validWith(withZod('export const user = z.object({});'), { filename: 'schema.test.ts' }),
    validWith(withZod('export const user = z.object({});'), {
      filename: 'src/generated/schema.ts',
      options: [{ allow: ['schema.ts'] }],
    }),
  ],
  invalid: [
    invalidWith({
      code: withZod('export const userSchema = z.object({ id: z.string() });'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const User = z.object({ id: z.string() });'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const user = z.object({}).strict();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const email = z.email();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const when = z.iso.datetime();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const day = z.iso.date();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const count = z.int();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const coerced = z.coerce.string();', ZOD_V4_IMPORT),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const isEven = z.custom<number>((value) => value % 2 === 0);'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const payload = z.strictObject({ id: z.string() });'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const bag = z.looseObject({});'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const keys = z.partialRecord(z.enum(["a"]), z.string());'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const xor = z.xor([z.string(), z.number()]);'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const css = z.templateLiteral([z.number(), z.enum(["px"])]);'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const hash = z.hash("sha256");'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const host = z.hostname();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const wrapped = (z.object({}));'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const branded = z.string().brand<"UserId">();'),
      errors: [error('naming')],
    }),
    invalidWith({
      name: 'allow does not match this file',
      code: withZod('export const user = z.object({});'),
      options: [{ allow: ['/generated/'] }],
      errors: [error('naming')],
    }),
  ],
});
