import { requirePluginNameName } from '../../../../src/plugins/elysia/rules/require-plugin-name.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = {
  filename: 'src/plugins/auth.ts',
  languageOptions: { parserOptions: { lang: 'ts' as const } },
};
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(requirePluginNameName, {
  valid: [
    {
      ...ts,
      code: `${elysiaImport}export const auth = new Elysia({ name: 'auth' }).get('/', () => 'ok')`,
    },
    {
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', () => 'ok').listen(3000)`,
    },
    // Local (non-exported) feature instance: name optional
    {
      ...ts,
      code: `${elysiaImport}const auth = new Elysia({ prefix: '/auth' })`,
    },
    // Entrypoint path allowlist
    {
      filename: 'src/main.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const app = new Elysia().get('/', () => 'ok')`,
    },
    {
      filename: 'src/server.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const app = new Elysia()`,
    },
    {
      filename: 'src/app.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export default new Elysia()`,
    },
    {
      filename: 'src/index.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const app = new Elysia()`,
    },
    // Named route plugin
    {
      filename: 'src/modules/auth/routes/list.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const AUTH_LIST_ROUTE = new Elysia({ name: 'AUTH_LIST_ROUTE' })`,
    },
    // User allow can re-open entry-style skips
    {
      filename: 'src/modules/auth/routes/list.ts',
      languageOptions: ts.languageOptions,
      options: [{ allow: ['/modules/'] }],
      code: `${elysiaImport}export const auth = new Elysia({ prefix: '/auth' })`,
    },
    // Spread options: conservatively treated as named
    {
      ...ts,
      code: `${elysiaImport}export const auth = new Elysia({ ...opts })`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}export const auth = new Elysia().get('/', () => 'ok')`,
      errors: [error('missingName')],
    },
    {
      ...ts,
      code: `${elysiaImport}export default new Elysia({ prefix: '/auth' })`,
      errors: [error('missingName')],
    },
    // Route files are no longer entry-allowlisted
    {
      filename: 'src/modules/billing/routes/status.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const BILLING_STATUS_ROUTE = new Elysia()`,
      errors: [error('missingName')],
    },
    {
      filename: 'src/controllers/users.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const users = new Elysia({ prefix: '/users' })`,
      errors: [error('missingName')],
    },
    {
      filename: 'src/routes/health.ts',
      languageOptions: ts.languageOptions,
      code: `${elysiaImport}export const health = new Elysia()`,
      errors: [error('missingName')],
    },
  ],
});
