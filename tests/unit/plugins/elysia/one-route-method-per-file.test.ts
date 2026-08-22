import { oneRouteMethodPerFileName } from '../../../../src/plugins/elysia/rules/one-route-method-per-file.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const leaf = { filename: 'src/modules/billing/routes/status.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(oneRouteMethodPerFileName, {
  valid: [
    {
      ...leaf,
      code: `${elysiaImport}export const BILLING_STATUS_ROUTE = new Elysia({ name: 'BILLING_STATUS_ROUTE' }).get('/status', () => 'ok')`,
    },
    {
      ...leaf,
      code: `${elysiaImport}export const X = new Elysia({ name: 'X' }).use(plugin)`,
    },
    // Zero route methods is fine
    {
      ...leaf,
      code: `${elysiaImport}export const X = new Elysia({ name: 'X' })`,
    },
    // Index mount tables are out of scope
    {
      filename: 'src/modules/billing/routes/index.ts',
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 1).post('/', () => 2)`,
    },
    // No elysia import: gated off
    {
      ...leaf,
      code: `export const X = new Elysia().get('/', () => 1).post('/', () => 2)`,
    },
    // Non-routes path
    {
      filename: 'src/plugins/auth.ts',
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 1).post('/', () => 2)`,
    },
    // Unrelated .get on non-Elysia
    {
      ...leaf,
      code: `${elysiaImport}const map = new Map(); map.get('a'); map.get('b')`,
    },
    // allow option
    {
      ...leaf,
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 1).post('/', () => 2)`,
      options: [{ allow: ['/billing/routes/status.ts'] }],
    },
    // Binding that resolves to Elysia: still one method
    {
      ...leaf,
      code: `${elysiaImport}const app = new Elysia()\napp.get('/', () => 'ok')`,
    },
  ],
  invalid: [
    {
      ...leaf,
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 1).post('/', () => 2)`,
      errors: [error('extraRoute')],
    },
    {
      ...leaf,
      code: `${elysiaImport}const app = new Elysia()\napp.get('/', () => 1)\napp.post('/', () => 2)\napp.delete('/', () => 3)`,
      errors: [error('extraRoute'), error('extraRoute')],
    },
    {
      ...leaf,
      code: `${elysiaImport}new Elysia().route('GET', '/', () => 1).route('POST', '/', () => 2)`,
      errors: [error('extraRoute')],
    },
    {
      ...leaf,
      code: `${elysiaImport}new Elysia().get('/', () => 1).put('/', () => 2).patch('/', () => 3)`,
      errors: [error('extraRoute'), error('extraRoute')],
    },
  ],
});
