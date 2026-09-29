import { preferStatusHelperName } from '../../../../src/plugins/elysia/rules/prefer-status-helper.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, status } from 'elysia'\n`;

runElysiaRule(preferStatusHelperName, {
  valid: [
    {
      name: 'logger .error() on a member chain is not the old context error()',
      ...ts,
      code: `${elysiaImport}app.get('/', ({ store }) => { store.logger.error('x'); return 'ok' })`,
    },
    {
      name: 'imported error() helper is not the old context error()',
      ...ts,
      code: `${elysiaImport}import { error } from './log'\napp.get('/', () => { error('x'); return 'ok' })`,
    },
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
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ status }) => status(418, 'teapot'))`,
    },
    {
      ...ts,
      code: `${elysiaImport}function log(error: (code: number) => void) { error(400) }`,
    },
  ],
  invalid: [
    {
      name: 'function-form context error()',
      ...ts,
      code: `${elysiaImport}app.get('/', function ({ error }) { return error(404) })`,
      errors: [error('preferStatusOverError')],
    },
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
    {
      ...ts,
      code: `${elysiaImport}app.get('/', ({ error }) => error(418, 'teapot'))`,
      errors: [error('preferStatusOverError')],
    },
    {
      ...ts,
      code: `${elysiaImport}app.get('/', () => 'ok', { beforeHandle: ({ error }) => error(401) })`,
      errors: [error('preferStatusOverError')],
    },
  ],
});
