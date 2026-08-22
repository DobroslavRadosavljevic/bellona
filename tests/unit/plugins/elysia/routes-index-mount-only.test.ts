import { routesIndexMountOnlyName } from '../../../../src/plugins/elysia/rules/routes-index-mount-only.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const index = { filename: 'src/modules/billing/routes/index.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(routesIndexMountOnlyName, {
  valid: [
    {
      ...index,
      code: `${elysiaImport}export const BILLING_ROUTES = new Elysia({ name: 'BILLING_ROUTES', prefix: '/billing' }).use(A).use(B)`,
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia({ name: 'X' }).as('scoped')`,
    },
    // Leaf route files are out of scope
    {
      filename: 'src/modules/billing/routes/status.ts',
      code: `${elysiaImport}export const X = new Elysia().get('/status', () => 'ok')`,
    },
    // No elysia import
    {
      ...index,
      code: `export const X = { get() { return 1 } }`,
    },
    // allow option
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 1)`,
      options: [{ allow: ['/routes/index.ts'] }],
    },
  ],
  invalid: [
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().get('/', () => 'ok')`,
      errors: [error('routeMethod')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().post('/', () => 'ok').put('/', () => 'ok')`,
      errors: [error('routeMethod'), error('routeMethod')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().onBeforeHandle(() => {})`,
      errors: [error('lifecycle')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().guard({ requireOnboarding: true })`,
      errors: [error('disallowedMethod')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().derive(() => ({ x: 1 }))`,
      errors: [error('lifecycle')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().resolve(() => ({ user: null }))`,
      errors: [error('lifecycle')],
    },
    {
      ...index,
      code: `${elysiaImport}export const X = new Elysia().group('/v1', (app) => app)`,
      errors: [error('disallowedMethod')],
    },
  ],
});
