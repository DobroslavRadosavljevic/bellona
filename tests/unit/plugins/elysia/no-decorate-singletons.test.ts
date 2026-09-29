import { noDecorateSingletonsName } from '../../../../src/plugins/elysia/rules/no-decorate-singletons.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

function singleton(name: string) {
  return { messageId: 'singleton' as const, data: { name } };
}

runElysiaRule(noDecorateSingletonsName, {
  valid: [
    { ...ts, code: `${elysiaImport}new Elysia().decorate('logger', logger)` },
    { ...ts, code: `${elysiaImport}new Elysia().decorate({ getDate: () => Date.now() })` },
    { name: 'no elysia import', ...ts, code: `app.decorate('db', db)` },
    { name: 'computed key', ...ts, code: `${elysiaImport}new Elysia().decorate({ [key]: db })` },
    {
      name: 'custom names replace the defaults',
      ...ts,
      options: [{ names: ['prisma'] }],
      code: `${elysiaImport}new Elysia().decorate('db', db)`,
    },
    {
      name: 'allow',
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}new Elysia().decorate('db', db)`,
    },
    {
      name: 'test file',
      filename: 'file.test.ts',
      code: `${elysiaImport}new Elysia().decorate('db', db)`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}new Elysia().decorate('db', db)`,
      errors: [singleton('db')],
    },
    {
      name: 'object form reports each singleton key',
      ...ts,
      code: `${elysiaImport}new Elysia().decorate({ db, runtime, logger })`,
      errors: [singleton('db'), singleton('runtime')],
    },
    {
      name: 'options first',
      ...ts,
      code: `${elysiaImport}new Elysia().decorate({ as: 'override' }, 'redis', redis)`,
      errors: [singleton('redis')],
    },
    {
      name: 'options first, object form',
      ...ts,
      code: `${elysiaImport}new Elysia().decorate({ as: 'override' }, { client })`,
      errors: [singleton('client')],
    },
    {
      name: 'object through a same-file const',
      ...ts,
      code: `${elysiaImport}const services = { database: pool }\nnew Elysia().decorate(services)`,
      errors: [singleton('database')],
    },
    {
      name: 'custom names',
      ...ts,
      options: [{ names: ['prisma'] }],
      code: `${elysiaImport}new Elysia().decorate('prisma', prisma)`,
      errors: [singleton('prisma')],
    },
  ],
});
