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
