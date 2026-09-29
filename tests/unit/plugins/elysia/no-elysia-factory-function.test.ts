import { noElysiaFactoryFunctionName } from '../../../../src/plugins/elysia/rules/no-elysia-factory-function.ts';
import { runElysiaRule } from './harness.ts';

const modules = { filename: 'src/modules/billing/routes/status.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

function factory(name: string) {
  return { messageId: 'factory' as const, data: { name } };
}

runElysiaRule(noElysiaFactoryFunctionName, {
  valid: [
    {
      ...modules,
      code: `${elysiaImport}export const billingStatusRoute = new Elysia({ name: 'BILLING_STATUS_ROUTE' }).get('/', () => 'ok')`,
    },
    {
      name: 'function without new Elysia',
      ...modules,
      code: `${elysiaImport}export function makeStatusRoute() { return 1 }`,
    },
    {
      name: 'route handler is not module level',
      ...modules,
      code: `${elysiaImport}export const route = new Elysia().get('/', () => { const inner = () => new Elysia(); return 'ok' })`,
    },
    {
      name: 'outside default directories',
      filename: 'src/server/plugins/session.ts',
      code: `${elysiaImport}export const sessionPlugin = (secret: string) => new Elysia({ name: 'SESSION', seed: secret })`,
    },
    {
      name: 'test file',
      filename: 'src/modules/billing/routes/status.test.ts',
      code: `${elysiaImport}function build() { return new Elysia() }`,
    },
    {
      name: 'allow',
      ...modules,
      options: [{ allow: ['/billing/'] }],
      code: `${elysiaImport}export function build() { return new Elysia() }`,
    },
    {
      name: 'custom directories exclude the default ones',
      ...modules,
      options: [{ directories: ['/features/'] }],
      code: `${elysiaImport}export function build() { return new Elysia() }`,
    },
  ],
  invalid: [
    {
      ...modules,
      code: `${elysiaImport}export function makeStatusRoute(db: Db) { return new Elysia().get('/', () => db.status()) }`,
      errors: [factory('makeStatusRoute')],
    },
    {
      name: 'exported arrow',
      filename: 'src/routes/users.ts',
      code: `${elysiaImport}export const usersRoutes = (runtime: Runtime) => new Elysia({ name: 'USERS' })`,
      errors: [factory('usersRoutes')],
    },
    {
      name: 'module-level function that is not exported',
      ...modules,
      code: `${elysiaImport}function build() { return new Elysia() }\nexport const route = build()`,
      errors: [factory('build')],
    },
    {
      name: 'default-exported function',
      ...modules,
      code: `${elysiaImport}export default function (db: Db) { return new Elysia() }`,
      errors: [factory('default')],
    },
    {
      name: 'no elysia import: the new Elysia shape is enough',
      ...modules,
      code: `import { Elysia } from './elysia'\nexport const build = function () { return new Elysia() }`,
      errors: [factory('build')],
    },
    {
      name: 'custom directories',
      filename: 'src/features/users/http.ts',
      options: [{ directories: ['/features/'] }],
      code: `${elysiaImport}export const build = () => new Elysia()`,
      errors: [factory('build')],
    },
    {
      name: 'empty directories means every path',
      filename: 'src/anywhere.ts',
      options: [{ directories: [] }],
      code: `${elysiaImport}export const build = () => new Elysia()`,
      errors: [factory('build')],
    },
  ],
});
