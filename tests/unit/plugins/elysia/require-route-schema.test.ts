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
  ],
});
