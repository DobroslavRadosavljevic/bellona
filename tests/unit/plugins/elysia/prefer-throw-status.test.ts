import { preferThrowStatusName } from '../../../../src/plugins/elysia/rules/prefer-throw-status.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = {
  filename: 'file.ts',
  languageOptions: { parserOptions: { lang: 'ts' as const } },
};
const elysiaImport = `import { Elysia, t, status } from 'elysia'\n`;

runElysiaRule(preferThrowStatusName, {
  valid: [
    {
      name: 'Elysia built-in error class sets its own status',
      ...ts,
      code: `import { Elysia, NotFoundError } from 'elysia'\napp.get('/', () => { throw new NotFoundError() })`,
    },
    {
      name: 'custom error class with status (documented Elysia pattern)',
      ...ts,
      code: `${elysiaImport}class TeapotError extends Error { status = 418 }\napp.get('/', () => { throw new TeapotError('x') })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => { throw status(400, 'bad') })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(400, 'bad'))`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => Effect.succeed(status(400, 'bad')))`,
    },
    {
      ...ts,
      code: `${elysiaImport}function outside() { throw new Error('x') }`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.onError(({ error }) => { throw status(500, error) })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/throw', ({ status }) => { throw status(418) })`,
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/return', ({ status }) => { return status(418) })`,
    },
    {
      filename: 'file.test.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}app.get('/', () => { throw new Error('x') })`,
    },
    {
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}app.get('/', () => { throw new Error('x') })`,
    },
  ],
  invalid: [
    {
      name: 'Error() called without new',
      ...ts,
      code: `${elysiaImport}app.get('/', () => { throw Error('x') })`,
      errors: [error('throwError')],
    },
    {
      name: 'macro resolve',
      ...ts,
      code: `${elysiaImport}new Elysia().macro({ auth: { resolve() { throw new Error('x') } } })`,
      errors: [error('throwError')],
    },
    {
      name: 'mapResolve lifecycle',
      ...ts,
      code: `${elysiaImport}new Elysia().mapResolve(() => { throw new Error('x') })`,
      errors: [error('throwError')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => { throw new Error('x') })`,
      errors: [error('throwError')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.post('/', () => { throw 'nope' }, { body: t.Any() })`,
      errors: [error('throwLiteral')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => { throw new TypeError('x') })`,
      errors: [error('throwError')],
    },
    {
      ...ts,
      code: `${elysiaImport}const handler = () => { throw new Error('x') }\napp.get('/', handler)`,
      errors: [error('throwError')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => 'ok', { beforeHandle: () => { throw new Error('x') } })`,
      errors: [error('throwError')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.onBeforeHandle(() => { throw new Error('x') })`,
      errors: [error('throwError')],
    },
  ],
});
