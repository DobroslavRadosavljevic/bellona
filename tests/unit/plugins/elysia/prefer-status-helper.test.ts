import { preferStatusHelperName } from '../../../../src/plugins/elysia/rules/prefer-status-helper.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, status } from 'elysia'\n`;

runElysiaRule(preferStatusHelperName, {
  valid: [
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => status(418, 'teapot'))`,
    },
    {
      ...ts,
      code: `${elysiaImport}function outside({ set }: { set: { status: number } }) { set.status = 400 }`,
    },
    // Lifecycle hook still prefers status(); this one already uses it
    {
      ...ts,
      code: `${elysiaImport}app.onBeforeHandle(() => status(401))`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ set }) => { set.status = 418; return 'x' })`,
      errors: [error('preferStatus')],
    },
    // Named handler
    {
      ...ts,
      code: `${elysiaImport}const handler = ({ set }: { set: { status: number } }) => { set.status = 400; return 'x' }\napp.get('/', handler)`,
      errors: [error('preferStatus')],
    },
    // beforeHandle hook
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => 'ok', { beforeHandle: ({ set }) => { set.status = 401 } })`,
      errors: [error('preferStatus')],
    },
  ],
});
