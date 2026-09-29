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
    // Parse / codec / function results are values, not schemas.
    { code: withZod('export const env = z.object({ PORT: z.string() }).parse(process.env);') },
    { code: withZod('export const result = z.string().safeParse(input);') },
    { code: withZod('export const pending = z.string().parseAsync(input);') },
    { code: withZod('export const date = z.iso.date().decode("2020-01-01");') },
    { code: withZod('export const jsonSchema = z.object({}).toJSONSchema();') },
    { code: withZod('export const meta = z.string().meta();') },
    { code: withZod('export const optional = z.string().optional().isOptional();') },
    {
      code: withZod(
        'export const trim = z.function({ input: [z.string()], output: z.string() }).implement((s) => s.trim());',
      ),
    },
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
      code: withZod('export const described = z.string().meta({ id: "x" });'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const flag = z.stringbool();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const id = z.uuidv7();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const key = z.ksuid();'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const maybe = z.optional(z.string());'),
      errors: [error('naming')],
    }),
    invalidWith({
      code: withZod('export const keys = z.keyof(z.object({ a: z.string() }));'),
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
