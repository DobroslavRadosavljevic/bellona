import { hookAfterRoutesName } from '../../../../src/plugins/elysia/rules/hook-after-routes.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

function late(method: string) {
  return { messageId: 'hookAfterRoutes' as const, data: { method } };
}

runElysiaRule(hookAfterRoutesName, {
  valid: [
    { ...ts, code: `${elysiaImport}new Elysia().onBeforeHandle(check).get('/', () => 'ok')` },
    {
      name: 'hook before a later route',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/a', a).onBeforeHandle(check).get('/b', b)`,
    },
    {
      name: 'hook before a later plugin',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/a', a).derive(load).use(usersRoute)`,
    },
    {
      name: 'no route in the chain',
      ...ts,
      code: `${elysiaImport}export const plugin = new Elysia({ name: 'P' }).resolve(load)`,
    },
    {
      name: 'scoped hook applies to parent routes',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onBeforeHandle({ as: 'scoped' }, check)`,
    },
    {
      name: 'global hook',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).derive({ as: 'global' }, load)`,
    },
    {
      name: 'non-static options',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).derive(options, load)`,
    },
    {
      name: 'later .as() lifts local hooks',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onBeforeHandle(check).as('scoped')`,
    },
    {
      name: 'onError also runs for the app-wide error handler',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onError(handle)`,
    },
    {
      name: 'onRequest runs before routing',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onRequest(handle)`,
    },
    {
      name: 'binding gets more routes later',
      ...ts,
      code: `${elysiaImport}const app = new Elysia().get('/a', a).onBeforeHandle(check)\napp.get('/b', b)`,
    },
    {
      name: 'guard with callback after the hook registers routes',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/a', a).onBeforeHandle(check).guard({}, (app) => app.get('/b', b))`,
    },
    { name: 'no elysia import', ...ts, code: `new Elysia().get('/', a).onBeforeHandle(check)` },
    {
      name: 'allow',
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}new Elysia().get('/', a).onBeforeHandle(check)`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onBeforeHandle(check)`,
      errors: [late('onBeforeHandle')],
    },
    {
      name: 'several late hooks, then listen',
      ...ts,
      code: `${elysiaImport}new Elysia().post('/', a).derive(load).onAfterHandle(log).listen(3000)`,
      errors: [late('derive'), late('onAfterHandle')],
    },
    {
      name: 'after a plugin',
      ...ts,
      code: `${elysiaImport}export const users = new Elysia({ name: 'USERS' }).use(listRoute).resolve(load)`,
      errors: [late('resolve')],
    },
    {
      name: 'explicit local scope',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).onTransform({ as: 'local' }, fix)`,
      errors: [late('onTransform')],
    },
    {
      name: 'guard without callback does not register routes',
      ...ts,
      code: `${elysiaImport}new Elysia().get('/', a).guard({ body: t.Object({}) }).onParse(parse)`,
      errors: [late('onParse')],
    },
    {
      name: 'binding without later routes',
      ...ts,
      code: `${elysiaImport}const app = new Elysia().get('/', a).mapResolve(load)\napp.listen(3000)`,
      errors: [late('mapResolve')],
    },
  ],
});
