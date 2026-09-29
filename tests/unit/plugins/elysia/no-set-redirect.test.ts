import { noSetRedirectName } from '../../../../src/plugins/elysia/rules/no-set-redirect.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(noSetRedirectName, {
  valid: [
    { ...ts, code: `${elysiaImport}app.get('/', ({ redirect }) => redirect('/login'))` },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ set }) => { set.headers['x-a'] = 'b'; return 'ok' })`,
    },
    { name: 'reading set.redirect', ...ts, code: `${elysiaImport}const url = set.redirect` },
    { name: 'other object', ...ts, code: `${elysiaImport}config.redirect = '/x'` },
    {
      name: 'no elysia import',
      ...ts,
      code: `app.get('/', ({ set }) => { set.redirect = '/login' })`,
    },
    {
      name: 'allow',
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}app.get('/', ({ set }) => { set.redirect = '/login' })`,
    },
    {
      name: 'test file',
      filename: 'file.test.ts',
      code: `${elysiaImport}app.get('/', ({ set }) => { set.redirect = '/login' })`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ set }) => { set.redirect = '/login' })`,
      errors: [error('setRedirect')],
    },
    {
      name: 'context member',
      ...ts,
      code: `${elysiaImport}app.get('/', (ctx) => { ctx.set.redirect = '/login' })`,
      errors: [error('setRedirect')],
    },
    {
      name: 'computed literal key',
      ...ts,
      code: `${elysiaImport}app.get('/', ({ set }) => { set['redirect'] = '/login' })`,
      errors: [error('setRedirect')],
    },
  ],
});
