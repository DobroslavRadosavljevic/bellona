import { noContextParamName } from '../../../../src/plugins/elysia/rules/no-context-param.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, type Context } from 'elysia'\n`;

runElysiaRule(noContextParamName, {
  valid: [
    { ...ts, code: `${elysiaImport}app.get('/', ({ body }) => body)` },
    {
      ...ts,
      code: `${elysiaImport}function handle({ body }: { body: string }) { return body }`,
    },
    {
      ...ts,
      code: `${elysiaImport}class C { static root(context: Context) { return context } }`,
    },
    // No elysia import: rule is gated off
    { ...ts, code: `function root(context: Context) { return context }` },
  ],
  invalid: [
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
  ],
});
