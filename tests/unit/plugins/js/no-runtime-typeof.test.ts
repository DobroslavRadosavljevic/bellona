import { noRuntimeTypeofName } from '../../../../src/plugins/js/rules/no-runtime-typeof.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'runtimeTypeof' };
const allowInTypeGuards = [{ allowInTypeGuards: true }];

runJsRule(noRuntimeTypeofName, {
  valid: [
    'const value = input;',
    {
      code: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
      options: allowInTypeGuards,
    },
    {
      code: 'const isString = (value: unknown): value is string => typeof value === "string";',
      options: allowInTypeGuards,
    },
    {
      code: 'function assertString(value: unknown): asserts value is string { if (typeof value !== "string") throw new Error(); }',
      options: allowInTypeGuards,
    },
  ],
  invalid: [
    { code: 'if (typeof input === "string") use(input);', errors: [error] },
    {
      code: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
      errors: [error],
    },
    {
      code: 'function parse(value: unknown): string { if (typeof value !== "string") throw new Error(); return value; }',
      options: allowInTypeGuards,
      errors: [error],
    },
    {
      code: 'function isString(value: unknown): value is string { const check = () => typeof value === "string"; return check(); }',
      options: allowInTypeGuards,
      errors: [error],
    },
  ],
});
