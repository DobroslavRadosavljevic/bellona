import { requireResponseSchemaName } from '../../../../src/plugins/elysia/rules/require-response-schema.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = {
  filename: 'file.ts',
  languageOptions: { parserOptions: { lang: 'ts' as const } },
};
const elysiaImport = `import { Elysia, t, status, redirect } from 'elysia'\n`;
const requireStatusOnly = [{ requireAllRoutes: false }];

runElysiaRule(requireResponseSchemaName, {
  valid: [
    {
      name: 'redirect with a response that has no redirect key',
      ...ts,
      code: `${elysiaImport}app.get('/go', ({ redirect }) => redirect('https://x'), { response: { 200: t.String() } })`,
    },
    {
      name: 'narrowed: redirect with a response that has no redirect key',
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/go', () => redirect('/x'), { response: { 401: t.Any() } })`,
    },
    {
      name: 'chained guard without callback supplies response',
      ...ts,
      code: `${elysiaImport}new Elysia().guard({ response: t.String() }).get('/', () => 'ok')`,
    },
    {
      name: 'deep member .status() is not Elysia status()',
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/', ({ upstream }) => upstream.res.status(502))`,
    },
    {
      name: 'deep member .redirect() is not Elysia redirect()',
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/', ({ store }) => store.router.redirect('/x'))`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => 'ok', { response: t.String() })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(200, 'ok'), { response: t.String() })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => Effect.succeed(status(200, 'ok')), { response: { 200: t.String() } })`,
    },
    // Express-style res.status: not Elysia status(); still needs response under default
    {
      ...ts,
      code: `${elysiaImport}app.get('/', (req, res) => res.status(400).send('x'), { response: t.String() })`,
    },
    // Named handler with response schema
    {
      ...ts,
      code: `${elysiaImport}const handler = () => status(418, 'teapot')\napp.get('/', handler, { response: t.String() })`,
    },
    // Spread may inject response
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(200, 'ok'), { ...shared })`,
    },
    // Redirect with a response schema
    {
      ...ts,
      code: `${elysiaImport}app.get('/go', ({ redirect }) => redirect('https://example.com'), { response: { 302: t.Any() } })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/go', () => redirect('https://example.com'), { response: { 301: t.Any(), 200: t.String() } })`,
    },
    // requireAllRoutes: false: plain routes ok without response
    {
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/', () => 'ok')`,
    },
    // requireAllRoutes: false. Express-style status ignored
    {
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/', (req, res) => res.status(400).send('x'))`,
    },
    // allow skips
    {
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}app.get('/', () => 'ok')`,
    },
    {
      filename: 'file.test.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}app.get('/', () => 'ok')`,
    },
    // Guard / group can supply response
    {
      ...ts,
      code: `${elysiaImport}app.guard({ response: t.String() }, (app) => app.get('/', () => 'ok'))`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.group('/v1', { response: { 302: t.Any() } }, (app) =>
  app.get('/go', ({ redirect }) => redirect('/x'))
)`,
    },
    // HTTP client is not a route
    {
      ...ts,
      code: `${elysiaImport}axios.post('/users', { name: 'x' })`,
    },
    // Inline literal handler still needs response under default — supplied
    {
      ...ts,
      code: `${elysiaImport}app.get('/', 'Hello', { response: t.String() })`,
    },
  ],
  invalid: [
    {
      name: 'guard after the route does not supply response',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', () => 'ok').guard({ response: t.String() })`,
      errors: [error('missingResponse')],
    },
    // Default requireAllRoutes: every route needs response
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => 'ok')`,
      errors: [error('missingResponse')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(418, 'teapot'))`,
      errors: [error('missingResponseStatus')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.post('/', () => status(400, 'bad'), { body: t.Object({}) })`,
      errors: [error('missingResponseStatus')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.put('/x', () => 'ok')`,
      errors: [error('missingResponse')],
    },
    // Redirect without response
    {
      ...ts,
      code: `${elysiaImport}app.get('/go', ({ redirect }) => redirect('https://example.com'))`,
      errors: [error('missingResponse')],
    },
    // requireAllRoutes: false: status() still checked
    {
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/', () => status(418, 'teapot'))`,
      errors: [error('missingResponseStatus')],
    },
    // requireAllRoutes: false: redirect still checked
    {
      ...ts,
      options: [...requireStatusOnly],
      code: `${elysiaImport}app.get('/go', () => redirect('/x'))`,
      errors: [error('missingResponse')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', 'Hello')`,
      errors: [error('missingResponse')],
    },
  ],
});
