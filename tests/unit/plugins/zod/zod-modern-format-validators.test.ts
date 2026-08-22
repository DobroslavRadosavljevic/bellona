import { zodModernFormatValidatorsName } from '../../../../src/plugins/zod/rules/zod-modern-format-validators.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { withZod, ZOD_MINI_IMPORT, ZOD_V4_IMPORT } from './fixtures.ts';
import { runZodRule } from './harness.ts';

function prefer(method: string, replacement: string) {
  return { messageId: 'preferTopLevel' as const, data: { method, replacement } };
}

runZodRule(zodModernFormatValidatorsName, {
  valid: [
    { code: withZod('const s = z.email();') },
    { code: withZod('const s = z.url();') },
    { code: withZod('const s = z.uuid();') },
    { code: withZod('const s = z.iso.datetime();') },
    { code: withZod('const s = z.iso.date();') },
    { code: withZod('const s = z.string().min(1);') },
    { code: withZod('const s = z.string().trim();') },
    { code: withZod('const s = z.email().min(1);') },
    { code: withZod('const s = z.coerce.string().email();') },
    { code: withZod('const s = z.coerce.string().min(1).email();') },
    { code: withZod('const s = other.string().email();') },
    { code: withZod('const s = z.date();') },
    { code: withZod('const s = z.string();') },
    { code: withZod('const s = z.custom((value) => typeof value === "string");') },
    { code: 'const s = z.string().email();' },
    validWith(withZod('const s = z.string().email();'), { filename: 'schema.test.ts' }),
    validWith(withZod('const s = z.string().email();'), { filename: 'schema.spec.ts' }),
    validWith(withZod('const s = z.string().email();'), {
      filename: 'src/generated/schema.ts',
      options: [{ allow: ['/generated/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      code: withZod('const s = z.string().email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().url();', ZOD_V4_IMPORT),
      errors: [prefer('url', 'z.url()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().uuid();', ZOD_MINI_IMPORT),
      errors: [prefer('uuid', 'z.uuid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().min(1).email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().trim().toLowerCase().email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = (z.string()).email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = z.string()!.email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = z.string()["email"]();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().httpUrl();'),
      errors: [prefer('httpUrl', 'z.httpUrl()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().uuidv4();'),
      errors: [prefer('uuidv4', 'z.uuid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().uuidv6();'),
      errors: [prefer('uuidv6', 'z.uuid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().uuidv7();'),
      errors: [prefer('uuidv7', 'z.uuid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().guid();'),
      errors: [prefer('guid', 'z.guid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().hostname();'),
      errors: [prefer('hostname', 'z.hostname()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().e164();'),
      errors: [prefer('e164', 'z.e164()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().emoji();'),
      errors: [prefer('emoji', 'z.emoji()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().base64();'),
      errors: [prefer('base64', 'z.base64()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().base64url();'),
      errors: [prefer('base64url', 'z.base64url()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().hex();'),
      errors: [prefer('hex', 'z.hex()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().jwt();'),
      errors: [prefer('jwt', 'z.jwt()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().nanoid();'),
      errors: [prefer('nanoid', 'z.nanoid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().cuid();'),
      errors: [prefer('cuid', 'z.cuid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().cuid2();'),
      errors: [prefer('cuid2', 'z.cuid2()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().ulid();'),
      errors: [prefer('ulid', 'z.ulid()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().ipv4();'),
      errors: [prefer('ipv4', 'z.ipv4()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().ipv6();'),
      errors: [prefer('ipv6', 'z.ipv6()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().ip();'),
      errors: [prefer('ip', 'z.ipv4() or z.ipv6()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().mac();'),
      errors: [prefer('mac', 'z.mac()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().cidrv4();'),
      errors: [prefer('cidrv4', 'z.cidrv4()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().cidrv6();'),
      errors: [prefer('cidrv6', 'z.cidrv6()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().creditCard();'),
      errors: [prefer('creditCard', 'z.creditCard()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().hash("sha256");'),
      errors: [prefer('hash', 'z.hash()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().datetime();'),
      errors: [prefer('datetime', 'z.iso.datetime()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().date();'),
      errors: [prefer('date', 'z.iso.date()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().time();'),
      errors: [prefer('time', 'z.iso.time()')],
    }),
    invalidWith({
      code: withZod('const s = z.string().duration();'),
      errors: [prefer('duration', 'z.iso.duration()')],
    }),
    invalidWith({
      code: withZod('const s = z.string({ error: "bad" }).email();'),
      errors: [prefer('email', 'z.email()')],
    }),
    invalidWith({
      name: 'allow does not match this file',
      code: withZod('const s = z.string().email();'),
      options: [{ allow: ['/generated/'] }],
      errors: [error('preferTopLevel')],
    }),
  ],
});
