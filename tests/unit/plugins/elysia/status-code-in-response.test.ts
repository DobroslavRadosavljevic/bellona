import { statusCodeInResponseName } from '../../../../src/plugins/elysia/rules/status-code-in-response.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, t, status } from 'elysia'\n`;

function missing(code: number) {
  return { messageId: 'statusNotInResponse' as const, data: { code: String(code) } };
}

runElysiaRule(statusCodeInResponseName, {
  valid: [
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, { error: 'x' }), { response: { 200: t.String(), 404: t.Object({}) } })`,
    },
    {
      name: 'named status in response',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status('Not Found', 'x'), { response: { 404: t.String() } })`,
    },
    {
      name: 'context status is typed by TypeScript',
      ...ts,
      code: `${elysiaImport}app.get('/', ({ status }) => status(404, 'x'), { response: { 200: t.String() } })`,
    },
    {
      name: 'macro key may add response entries',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(401, 'x'), { user: true, response: { 200: t.String() } })`,
    },
    {
      name: 'non-literal response',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, 'x'), { response: t.String() })`,
    },
    {
      name: 'response with a spread',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, 'x'), { response: { ...errors, 200: t.String() } })`,
    },
    {
      name: 'hook with a spread',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, 'x'), { ...shared, response: { 200: t.String() } })`,
    },
    {
      name: 'guard response merges',
      ...ts,
      code: `${elysiaImport}new Elysia().guard({ response: { 404: t.String() } }).get('/', () => status(404, 'x'), { response: { 200: t.String() } })`,
    },
    {
      name: 'dynamic code',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(code, 'x'), { response: { 200: t.String() } })`,
    },
    {
      name: 'no response schema: require-response-schema covers it',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, 'x'))`,
    },
    {
      name: 'no elysia import',
      ...ts,
      code: `app.get('/', () => status(404, 'x'), { response: { 200: t.String() } })`,
    },
    {
      name: 'allow',
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}app.get('/', () => status(404, 'x'), { response: { 200: t.String() } })`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(404, 'x'), { response: { 200: t.String() } })`,
      errors: [missing(404)],
    },
    {
      name: 'named status',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status('Conflict', 'x'), { response: { 200: t.String() } })`,
      errors: [missing(409)],
    },
    {
      name: 'nested in an Effect callback',
      ...ts,
      code: `${elysiaImport}app.post('/', () => run(Effect.catchTag('X', () => Effect.succeed(status(403, 'x')))), { body: t.Object({}), response: { 200: t.String(), 401: t.String() } })`,
      errors: [missing(403)],
    },
    {
      name: 'response through a same-file const',
      ...ts,
      code: `${elysiaImport}const response = { 200: t.String() }\napp.get('/', () => status(500, 'x'), { response })`,
      errors: [missing(500)],
    },
    {
      name: 'string response keys',
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(201, 'x'), { response: { '200': t.String() } })`,
      errors: [missing(201)],
    },
  ],
});
