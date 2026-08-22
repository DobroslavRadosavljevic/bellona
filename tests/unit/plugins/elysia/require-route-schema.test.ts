import { requireRouteSchemaName } from '../../../../src/plugins/elysia/rules/require-route-schema.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = {
  filename: 'file.ts',
  languageOptions: { parserOptions: { lang: 'ts' as const } },
};
const elysiaImport = `import { Elysia, t } from 'elysia'\n`;

runElysiaRule(requireRouteSchemaName, {
  valid: [
    { ...ts, code: `${elysiaImport}app.get('/', () => 'ok')` },
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ body }) => body, { body: t.Object({}) })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.put('/:id', ({ params }) => params, { params: t.Object({ id: t.String() }) })`,
    },
    // Enclosing .guard() supplies schema
    {
      ...ts,
      code: `${elysiaImport}app.guard({ body: t.Object({}) }, (app) => app.post('/', ({ body }) => body))`,
    },
    // Guard supplies params for path param route
    {
      ...ts,
      code: `${elysiaImport}app.guard({ params: t.Object({ id: t.String() }) }, (app) => app.get('/:id', ({ params }) => params))`,
    },
    // Hook object via identifier
    {
      ...ts,
      code: `${elysiaImport}const hook = { body: t.Object({}) }\napp.post('/', ({ body }) => body, hook)`,
    },
    // Spread may inject schema
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ body }) => body, { ...shared })`,
    },
    // GET with path params + params schema
    {
      ...ts,
      code: `${elysiaImport}app.get('/:id', ({ params }) => params, { params: t.Object({ id: t.String() }) })`,
    },
    // GET with query destructure + query schema
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ query }) => query, { query: t.Object({}) })`,
    },
    // Nested path params
    {
      ...ts,
      code: `${elysiaImport}app.get('/users/:userId/posts/:postId', () => 'ok', { params: t.Object({}) })`,
    },
    // No elysia import: gated off
    { ...ts, code: `app.post('/', ({ body }) => body)` },
    // methods option can disable mutating check while params still apply
    {
      ...ts,
      options: [{ methods: [] }],
      code: `${elysiaImport}app.post('/', () => 'ok')`,
    },
    {
      ...ts,
      options: [{ methods: ['delete'] }],
      code: `${elysiaImport}app.post('/', () => 'ok')`,
    },
    {
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}app.post('/', ({ body }) => body)`,
    },
    // .group() hook supplies schema
    {
      ...ts,
      code: `${elysiaImport}app.group('/v1', { body: t.Object({}) }, (app) => app.post('/', ({ body }) => body))`,
    },
    // Optional path param still needs params schema — supplied here
    {
      ...ts,
      code: `${elysiaImport}app.get('/:id?', ({ params }) => params, { params: t.Object({ id: t.Optional(t.String()) }) })`,
    },
    // HTTP client: data object in handler slot is not an Elysia route
    {
      ...ts,
      code: `${elysiaImport}axios.post('/users', { name: 'x' })`,
    },
    {
      ...ts,
      code: `${elysiaImport}client.get('/users')`,
    },
    // Inline string handler (Elysia allows this)
    {
      ...ts,
      code: `${elysiaImport}app.get('/', 'Hello World')`,
    },
    // Destructured headers / cookie / body with matching schemas
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ headers }) => headers, { headers: t.Object({}) })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ cookie }) => cookie, { cookie: t.Object({}) })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ body }) => body, { body: t.Object({}) })`,
    },
    // POST with body schema; extra unused hook keys ok
    {
      ...ts,
      code: `${elysiaImport}new Elysia().post('/', ({ body }) => body, { body: t.Object({}), response: t.Any() })`,
    },
    // .route('POST', …) uses the verb for methods
    {
      ...ts,
      code: `${elysiaImport}app.route('POST', '/', ({ body }) => body, { body: t.Object({}) })`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ body }) => body)`,
      errors: [error('missingSchema')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.patch('/', () => 'ok', { beforeHandle: () => {} })`,
      errors: [error('missingSchema')],
    },
    // Path params require params schema (GET, outside default methods)
    {
      ...ts,
      code: `${elysiaImport}app.get('/:id', () => 'ok')`,
      errors: [error('missingParams')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/users/:id', ({ params }) => params)`,
      errors: [error('missingParams')],
    },
    // Destructured query without query schema
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ query }) => query)`,
      errors: [error('missingQuery')],
    },
    // Destructured params without path param segment
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ params }) => params)`,
      errors: [error('missingParams')],
    },
    // POST with path params: both missingParams + missingSchema
    {
      ...ts,
      code: `${elysiaImport}app.post('/:id', () => 'ok')`,
      errors: [error('missingParams'), error('missingSchema')],
    },
    // POST with query destructure but only body missing → missingQuery + missingSchema
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ query }) => query)`,
      errors: [error('missingQuery'), error('missingSchema')],
    },
    // Body present but query destructured without query schema
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ query, body }) => body, { body: t.Object({}) })`,
      errors: [error('missingQuery')],
    },
    // .route() with path params
    {
      ...ts,
      code: `${elysiaImport}app.route('GET', '/:id', () => 'ok')`,
      errors: [error('missingParams')],
    },
    // methods: [] still enforces path params
    {
      ...ts,
      options: [{ methods: [] }],
      code: `${elysiaImport}app.get('/:id', () => 'ok')`,
      errors: [error('missingParams')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/:id?', () => 'ok')`,
      errors: [error('missingParams')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ headers }) => headers)`,
      errors: [error('missingHeaders')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ cookie }) => cookie)`,
      errors: [error('missingCookie')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.post('/', ({ body }) => body, { query: t.Object({}) })`,
      errors: [error('missingBody')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.route('POST', '/', () => 'ok')`,
      errors: [error('missingSchema')],
    },
  ],
});
