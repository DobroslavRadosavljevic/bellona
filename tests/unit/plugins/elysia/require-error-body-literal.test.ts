import { requireErrorBodyLiteralName } from '../../../../src/plugins/elysia/rules/require-error-body-literal.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, status } from 'elysia'\n`;

runElysiaRule(requireErrorBodyLiteralName, {
  valid: [
    {
      name: 'string literal code',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(400, { code: 'bad_request', message: 'bad' }))`,
    },
    {
      name: 'const string identifier code',
      ...ts,
      code: `${elysiaImport}const CODE = 'unauthorized'
app.get('/', () => status(401, { code: CODE, message: 'Unauthorized' }))`,
    },
    {
      name: 'dynamic message allowed',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(403, { code: 'forbidden', message: permission.message }))`,
    },
    {
      name: 'success status with non-literal ignored',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(200, { code: some.msg, message: 'x' }))`,
    },
    {
      name: 'no code key',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(400, { message: 'x' }))`,
    },
    {
      name: 'outside handler',
      ...ts,
      code: `${elysiaImport}function outside() { return status(400, { code: oops, message: 'x' }) }`,
    },
    {
      name: 'no elysia import',
      ...ts,
      code: `app.get('/', () => status(400, { code: x.y, message: 'x' }))`,
    },
    {
      name: 'allow path',
      filename: 'src/legacy/route.ts',
      code: `${elysiaImport}app.get('/', () => status(400, { code: \`bad\`, message: 'x' }))`,
      options: [{ allow: ['/legacy/'] }],
    },
    {
      name: 'identifier status with literal code',
      ...ts,
      code: `${elysiaImport}const code = 402
app.get('/', () => status(code, { code: 'pay', message: 'Pay' }))`,
    },
    {
      name: 'string body without object',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(418, "I'm a teapot"))`,
    },
  ],
  invalid: [
    {
      name: 'template literal',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(400, { code: \`bad\`, message: 'x' }))`,
      errors: [error('nonLiteralCode')],
    },
    {
      name: 'member access',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(403, { code: errors.forbidden, message: 'x' }))`,
      errors: [error('nonLiteralCode')],
    },
    {
      name: 'identifier status with member code',
      ...ts,
      code: `${elysiaImport}const code = 500
app.get('/', () => status(code, { code: Errors.fail, message: 'x' }))`,
      errors: [error('nonLiteralCode')],
    },
    {
      name: 'named handler',
      ...ts,
      code: `${elysiaImport}const handler = () => status(404, { code: Messages.missing, message: 'x' })
app.get('/', handler)`,
      errors: [error('nonLiteralCode')],
    },
    {
      name: 'Effect.succeed status',
      ...ts,
      code: `${elysiaImport}app.post('/', () => Effect.succeed(status(402, { code: codes.insufficient, message: 'x' })))`,
      errors: [error('nonLiteralCode')],
    },
  ],
});
