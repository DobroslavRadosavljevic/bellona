import { noContextParamName } from '../../../../src/plugins/elysia/rules/no-context-param.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, type Context } from 'elysia'\n`;

runElysiaRule(noContextParamName, {
  valid: [
    {
      name: 'Effect Context namespace is not Elysia Context',
      ...ts,
      code: `import { Elysia } from 'elysia'\nimport { Context } from 'effect'\nconst run = (services: Context.Context<never>) => services`,
    },
    {
      name: 'Context imported from another framework',
      ...ts,
      code: `import { Elysia } from 'elysia'\nimport type { Context } from 'hono'\nconst root = (c: Context) => c`,
    },
    {
      name: 'import type from another package',
      ...ts,
      code: `import { Elysia } from 'elysia'\nconst root = (c: import('hono').Context) => c`,
    },
    { ...ts, code: `${elysiaImport}app.get('/', ({ body }) => body)` },
    {
      ...ts,
      code: `${elysiaImport}function handle({ body }: { body: string }) { return body }`,
    },
    {
      ...ts,
      code: `${elysiaImport}class C { static doStuff(stuff: string) { return stuff } }`,
    },
    {
      name: 'Effect Context namespace on a class method',
      ...ts,
      code: `import { Elysia } from 'elysia'\nimport { Context } from 'effect'\nclass C { run(services: Context.Context<never>) { return services } }`,
    },
    {
      name: 'class method outside an elysia file',
      ...ts,
      code: `class C { static root(context: Context) { return context } }`,
    },
    {
      name: 'allow skips class methods',
      ...ts,
      options: [{ allow: ['file.ts'] }],
      code: `${elysiaImport}class C { static root(context: Context) { return context } }`,
    },
    // No elysia import: rule is gated off
    { ...ts, code: `function root(context: Context) { return context }` },
  ],
  invalid: [
    {
      name: 'static class method',
      ...ts,
      code: `${elysiaImport}class Controller { static root(context: Context) { return context } }`,
      errors: [error('contextClass')],
    },
    {
      name: 'class arrow field',
      ...ts,
      code: `${elysiaImport}class Controller { root = (context: Context) => context }`,
      errors: [error('contextClass')],
    },
    {
      name: 'class method reports once for many Context params',
      ...ts,
      code: `${elysiaImport}class Controller { run(a: Context, b: Context) { return [a, b] } }`,
      errors: [error('contextClass')],
    },
    {
      name: 'aliased Elysia Context',
      ...ts,
      code: `import { Elysia, type Context as ElysiaContext } from 'elysia'\nconst root = (c: ElysiaContext) => c`,
      errors: [error('contextParam')],
    },
    {
      name: 'Elysia namespace import',
      ...ts,
      code: `import * as E from 'elysia'\nconst root = (c: E.Context) => c`,
      errors: [error('contextParam')],
    },
    {
      ...ts,
      code: `${elysiaImport}function root(context: Context) { return context }`,
      errors: [error('contextParam')],
    },
    {
      ...ts,
      code: `${elysiaImport}const root = (context: Context) => context`,
      errors: [error('contextParam')],
    },
    {
      ...ts,
      code: `${elysiaImport}const root = (context: Context | undefined) => context`,
      errors: [error('contextParam')],
    },
    {
      ...ts,
      code: `${elysiaImport}const c = { root(context: Context) { return context } }`,
      errors: [error('contextParam')],
    },
    {
      ...ts,
      code: `${elysiaImport}const root = (context: import('elysia').Context) => context`,
      errors: [error('contextParam')],
    },
  ],
});
