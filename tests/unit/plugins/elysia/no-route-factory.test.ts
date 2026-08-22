import { noRouteFactoryName } from '../../../../src/plugins/elysia/rules/no-route-factory.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const modules = { filename: 'src/modules/billing/utils/http.ts' };
const routes = { filename: 'src/modules/billing/routes/helpers.ts' };

runElysiaRule(noRouteFactoryName, {
  valid: [
    {
      ...modules,
      code: `export const BILLING_STATUS_ROUTE = new Elysia({ name: 'BILLING_STATUS_ROUTE' })`,
    },
    {
      ...modules,
      code: `function makeRouteHelper() { return 1 }`,
    },
    {
      ...modules,
      code: `const makeFooRoute = () => 1`,
    },
    {
      ...modules,
      code: `export function loadBillingStatus() { return 1 }`,
    },
    // Outside modules/routes
    {
      filename: 'src/lib/make-route.ts',
      code: `export function makeFooRoute() { return 1 }`,
    },
    // allow option
    {
      ...modules,
      code: `export function makeFooRoute() { return 1 }`,
      options: [{ allow: ['/billing/utils/'] }],
    },
    // custom patterns override defaults
    {
      ...modules,
      code: `export function makeFooRoute() { return 1 }`,
      options: [{ patterns: ['^buildHttp'] }],
    },
  ],
  invalid: [
    {
      ...modules,
      code: `export function makeFooRoute() { return 1 }`,
      errors: [error('factory')],
    },
    {
      ...modules,
      code: `export const createStatusHandler = () => () => 'ok'`,
      errors: [error('factory')],
    },
    {
      ...routes,
      code: `export function createJobHttp() { return 1 }`,
      errors: [error('factory')],
    },
    {
      ...modules,
      code: `export const BillingRouteFactory = () => new Elysia()`,
      errors: [error('factory')],
    },
    {
      ...modules,
      code: `export function mapCreditHttpMapper() { return {} }`,
      errors: [error('factory')],
    },
    {
      ...modules,
      code: `export function createBillingHttp() { return 1 }`,
      errors: [error('factory')],
    },
    {
      ...modules,
      code: `export function buildHttpMapper() { return 1 }`,
      options: [{ patterns: ['^buildHttp'] }],
      errors: [error('factory')],
    },
  ],
});
