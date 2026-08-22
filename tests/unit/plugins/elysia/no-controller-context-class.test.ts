import { noControllerContextClassName } from '../../../../src/plugins/elysia/rules/no-controller-context-class.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia, type Context } from 'elysia'\n`;

runElysiaRule(noControllerContextClassName, {
  valid: [
    {
      ...ts,
      code: `${elysiaImport}class C { static doStuff(stuff: string) { return stuff } }`,
    },
    // Covered by no-context-param instead
    {
      ...ts,
      code: `${elysiaImport}function root(context: Context) { return context }`,
    },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}class Controller { static root(context: Context) { return context } }`,
      errors: [error('contextClass')],
    },
    {
      ...ts,
      code: `${elysiaImport}class Controller { root = (context: Context) => context }`,
      errors: [error('contextClass')],
    },
  ],
});
