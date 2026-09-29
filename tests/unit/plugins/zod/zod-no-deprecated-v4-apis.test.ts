import { zodNoDeprecatedV4ApisName } from '../../../../src/plugins/zod/rules/zod-no-deprecated-v4-apis.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { withZod, ZOD_V4_IMPORT } from './fixtures.ts';
import { runZodRule } from './harness.ts';

function method(name: string, replacement: string) {
  return { messageId: 'deprecatedMethod' as const, data: { method: name, replacement } };
}

runZodRule(zodNoDeprecatedV4ApisName, {
  valid: [
    { code: withZod('const s = z.string().min(1, { error: "Required" });') },
    { code: withZod('const s = z.string().min(1, "Required");') },
    {
      name: 'message is a schema field',
      code: withZod('const s = z.object({ message: z.string() });'),
    },
    {
      name: 'message field in extend / pick',
      code: withZod(
        'const a = BaseSchema.extend({ message: z.string() });\nconst b = BaseSchema.pick({ message: true });',
      ),
    },
    {
      name: 'message is not a string literal',
      code: withZod('const s = z.object({}, { message: MessageSchema });'),
    },
    {
      name: 'issue message inside superRefine is not a param',
      code: withZod(
        'const s = z.string().superRefine((v, ctx) => ctx.addIssue({ code: "custom", message: "bad" }));',
      ),
    },
    { code: withZod('const s = A.extend(B.shape);') },
    { code: withZod('const s = z.object({}).loose();') },
    { code: withZod('const s = z.object({}).strict();') },
    { code: withZod('const s = z.string().superRefine(() => {});') },
    { code: withZod('const s = z.enum(Role);') },
    { code: withZod('const s = z.number().multipleOf(5);') },
    { code: withZod('const tree = z.treeifyError(result.error);') },
    { name: 'lodash merge is not a Zod schema', code: withZod('const s = _.merge(a, b);') },
    { name: 'plain object merge', code: withZod('const s = config.merge(other);') },
    { name: 'date format is not ZodError', code: withZod('const s = date.format("yyyy");') },
    {
      name: 'format on an identifier without a ZodError check',
      code: withZod('const s = err.format();'),
    },
    { name: 'no zod import', code: 'const s = z.object({}).passthrough();' },
    validWith(withZod('const s = z.object({}).passthrough();'), { filename: 'schema.test.ts' }),
    validWith(withZod('const s = z.object({}).passthrough();'), {
      filename: 'src/generated/schema.ts',
      options: [{ allow: ['/generated/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      code: withZod('const s = z.string().min(1, { message: "Required" });'),
      errors: [error('messageParam')],
    }),
    invalidWith({
      code: withZod('const s = z.string({ message: `Bad ${field}` });', ZOD_V4_IMPORT),
      errors: [error('messageParam')],
    }),
    invalidWith({
      name: 'message in the second argument of z.object',
      code: withZod('const s = z.object({ message: z.string() }, { message: "Bad" });'),
      errors: [error('messageParam')],
    }),
    invalidWith({
      code: withZod('const s = z.string().refine((v) => v.length > 0, { message: "Empty" });'),
      errors: [error('messageParam')],
    }),
    invalidWith({
      code: withZod('const s = z.object({}).merge(z.object({}));'),
      errors: [method('merge', '`A.extend(B.shape)`')],
    }),
    invalidWith({
      name: 'merge on a Schema-named identifier',
      code: withZod('const s = UserSchema.merge(AuditSchema);'),
      errors: [method('merge', '`A.extend(B.shape)`')],
    }),
    invalidWith({
      name: 'merge on a same-file const',
      code: withZod('const base = z.object({});\nconst s = base.merge(other);'),
      errors: [method('merge', '`A.extend(B.shape)`')],
    }),
    invalidWith({
      code: withZod('const s = z.object({}).passthrough();'),
      errors: [method('passthrough', '`.loose()` or `z.looseObject(…)`')],
    }),
    invalidWith({
      code: withZod('const s = z.number().step(5);'),
      errors: [method('step', '`.multipleOf(n)`')],
    }),
    invalidWith({
      code: withZod('const s = z.number().safe();'),
      errors: [method('safe', '`.int()`')],
    }),
    invalidWith({
      code: withZod('const s = z.coerce.number().finite();'),
      errors: [error('deprecatedMethod')],
    }),
    invalidWith({
      code: withZod('const s = z.string().default("a").removeDefault();'),
      errors: [method('removeDefault', '`.unwrap()`')],
    }),
    invalidWith({
      code: withZod('const s = z.string().catch("a").removeCatch();'),
      errors: [method('removeCatch', '`.unwrap()`')],
    }),
    invalidWith({
      code: withZod('const s = z.nativeEnum(Role);'),
      errors: [error('nativeEnum')],
    }),
    invalidWith({
      code: withZod('const f = result.error.format();'),
      errors: [
        {
          messageId: 'errorMethod',
          data: { method: 'format', replacement: '`z.treeifyError(error)`' },
        },
      ],
    }),
    invalidWith({
      code: withZod('const f = result.error.flatten();'),
      errors: [error('errorMethod')],
    }),
    invalidWith({
      name: 'flatten inside an instanceof ZodError check',
      code: withZod(
        'try { run() } catch (err) { if (err instanceof z.ZodError) { log(err.flatten()) } }',
      ),
      errors: [error('errorMethod')],
    }),
    invalidWith({
      name: 'allow does not match this file',
      code: withZod('const s = z.nativeEnum(Role);'),
      options: [{ allow: ['/generated/'] }],
      errors: [error('nativeEnum')],
    }),
  ],
});
