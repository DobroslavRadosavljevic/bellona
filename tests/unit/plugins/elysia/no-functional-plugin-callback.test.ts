import { noFunctionalPluginCallbackName } from '../../../../src/plugins/elysia/rules/no-functional-plugin-callback.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(noFunctionalPluginCallbackName, {
  valid: [
    { ...ts, code: `${elysiaImport}app.use(authPlugin)` },
    { ...ts, code: `${elysiaImport}app.use(new Elysia({ name: 'x' }))` },
    // Express .use without elysia import: gated off
    { ...ts, code: `app.use((req, res, next) => next())` },
    // Named plugin instance: not a functional callback
    {
      ...ts,
      code: `${elysiaImport}export const route = new Elysia({ name: 'R' }).use(otherNamedPlugin)`,
    },
    // Effect Service.use inside an Elysia file must not be flagged
    {
      ...ts,
      code: `${elysiaImport}import { Effect } from 'effect'
class FooService { static use(f: any) { return f({}) } }
export const route = new Elysia({ name: 'R' }).get('/', () =>
  Effect.runPromise(FooService.use((service) => service))
)`,
    },
    {
      ...ts,
      code: `${elysiaImport}function run() {
  return SomeService.use((service) => service.doThing())
}`,
    },
    {
      ...ts,
      code: `${elysiaImport}function* run() {
  yield* AuthUserReadService.use((service) => {
    return service.getUser(userId)
  })
}`,
    },
    {
      ...ts,
      code: `${elysiaImport}Context.Service.use((service) => service.leave())`,
    },
    // Unknown receiver: not proven Elysia-shaped
    {
      ...ts,
      code: `${elysiaImport}app.use((app) => app.get('/', () => 'ok'))`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}export const plugin = new Elysia().use((app) => app.get('/', () => 'ok'))`,
      errors: [error('functionalPlugin')],
    },
    {
      ...ts,
      code: `${elysiaImport}const app = new Elysia()
app.use((app) => app.post('/x', () => 'ok'))`,
      errors: [error('functionalPlugin')],
    },
    {
      ...ts,
      code: `${elysiaImport}const app = new Elysia().get('/', () => 'ok')
app.use(function (app) { return app })`,
      errors: [error('functionalPlugin')],
    },
    {
      ...ts,
      code: `${elysiaImport}new Elysia({ name: 'p' }).use((plugin) => plugin.get('/', () => 'ok'))`,
      errors: [error('functionalPlugin')],
    },
  ],
});
