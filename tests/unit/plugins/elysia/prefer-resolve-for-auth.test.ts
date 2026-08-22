import { preferResolveForAuthName } from '../../../../src/plugins/elysia/rules/prefer-resolve-for-auth.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const pluginFile = { filename: 'src/plugins/session/plugin.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(preferResolveForAuthName, {
  valid: [
    {
      name: 'IP-only derive',
      ...pluginFile,
      code: `${elysiaImport}export const IP = new Elysia({ name: 'IP' }).derive(({ request }) => ({ ip: request.url }))`,
    },
    {
      name: 'IP derive with as:global',
      ...pluginFile,
      code: `${elysiaImport}export const IP = new Elysia({ name: 'IP' }).derive({ as: 'global' }, ({ request, server }) => ({
  ip: server?.requestIP?.(request)?.address ?? '0.0.0.0',
}))`,
    },
    {
      name: 'macro resolve auth (not derive)',
      ...pluginFile,
      code: `${elysiaImport}export const SESSION = new Elysia({ name: 'S' }).macro({
  auth: {
    async resolve({ request: { headers } }) {
      return { user: null, session: null }
    },
  },
})`,
    },
    {
      name: 'non-plugin path ignored',
      filename: 'src/modules/orgs/routes/create.ts',
      code: `${elysiaImport}export const x = new Elysia().derive(({ cookie }) => ({ user: cookie.session }))`,
    },
    {
      name: 'non-auth derive',
      ...pluginFile,
      code: `${elysiaImport}export const P = new Elysia({ name: 'P' }).derive(() => ({ requestId: '1' }))`,
    },
    {
      name: 'no elysia import',
      ...pluginFile,
      code: `app.derive(({ cookie }) => ({ user: cookie.a }))`,
    },
    {
      name: 'allow option',
      filename: 'src/plugins/legacy/auth.ts',
      code: `${elysiaImport}export const A = new Elysia().derive(({ cookie }) => ({ session: cookie.s }))`,
      options: [{ allow: ['/legacy/'] }],
    },
  ],
  invalid: [
    {
      name: 'derive returns user',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive(() => ({ user: { id: 1 } }))`,
      errors: [error('preferResolve')],
    },
    {
      name: 'derive returns session',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive(async () => {
  return { session: {} }
})`,
      errors: [error('preferResolve')],
    },
    {
      name: 'derive cookie param',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive(({ cookie }) => ({ token: cookie.auth.value }))`,
      errors: [error('preferResolve')],
    },
    {
      name: 'derive headers.authorization',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive(({ headers }) => ({
  token: headers.authorization,
}))`,
      errors: [error('preferResolve')],
    },
    {
      name: 'derive jwt',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive(({ jwt }) => ({ claims: jwt }))`,
      errors: [error('preferResolve')],
    },
    {
      name: 'derive with as + auth return',
      ...pluginFile,
      code: `${elysiaImport}export const A = new Elysia({ name: 'A' }).derive({ as: 'scoped' }, () => ({ auth: true }))`,
      errors: [error('preferResolve')],
    },
  ],
});
