import { requireRouteExportNameName } from '../../../../src/plugins/elysia/rules/require-route-export-name.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const leaf = { filename: 'src/modules/billing/routes/status.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(requireRouteExportNameName, {
  valid: [
    {
      ...leaf,
      code: `${elysiaImport}export const billingStatusRoute = new Elysia({ name: 'BILLING_STATUS_ROUTE' }).get('/status', () => 'ok')`,
    },
    {
      ...leaf,
      code: `${elysiaImport}export const creditsRoutes = new Elysia({ name: 'CREDITS_ROUTES', prefix: '/credits' }).use(A)`,
    },
    // Non-exported local instance: out of scope
    {
      ...leaf,
      code: `${elysiaImport}const app = new Elysia().get('/', () => 'ok')`,
    },
    // Index files out of scope
    {
      filename: 'src/modules/billing/routes/index.ts',
      code: `${elysiaImport}export const billing = new Elysia()`,
    },
    // Non-routes path
    {
      filename: 'src/plugins/auth.ts',
      code: `${elysiaImport}export const auth = new Elysia({ name: 'auth' })`,
    },
    // allow option
    {
      ...leaf,
      code: `${elysiaImport}export const status = new Elysia({ name: 'status' })`,
      options: [{ allow: ['/routes/status.ts'] }],
    },
  ],
  invalid: [
    {
      ...leaf,
      code: `${elysiaImport}export const billingStatus = new Elysia({ name: 'BILLING_STATUS' })`,
      errors: [error('badName')],
    },
    {
      ...leaf,
      code: `${elysiaImport}export const billingStatusRoute = new Elysia()`,
      errors: [error('missingNameOption')],
    },
    {
      ...leaf,
      code: `${elysiaImport}export const billingStatusRoute = new Elysia({ name: 'OTHER_ROUTE' })`,
      errors: [error('nameMismatch')],
    },
    {
      ...leaf,
      code: `${elysiaImport}export const StatusRoute = new Elysia({ name: 'STATUS_ROUTE' })`,
      errors: [error('badName')],
    },
    {
      ...leaf,
      code: `${elysiaImport}export default new Elysia({ name: 'X' })`,
      errors: [error('defaultExport')],
    },
    {
      ...leaf,
      code: `${elysiaImport}export const BILLING_STATUS_ROUTE = new Elysia({ name: 'BILLING_STATUS_ROUTE' })`,
      errors: [error('badName')],
    },
  ],
});
