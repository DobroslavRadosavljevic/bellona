import { preferPredicateName } from '../../../../src/plugins/effect/rules/prefer-predicate.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferPredicateName, {
  valid: [
    { ...ts, code: withEffect('if (Predicate.isString(x)) { x }') },
    { ...ts, code: withEffect('function isUser(u: unknown) { return true }') },
    {
      ...testTs,
      code: withEffect(
        'function isString(u: unknown): u is string { return typeof u === "string" }',
      ),
    },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect('function isString(u: unknown): u is string { return typeof u === "string" }'),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect(
        'function isString(u: unknown): u is string { return typeof u === "string" }',
      ),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('const isObject = (u: unknown) => u !== null && typeof u === "object"'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('const isRecord = (u: unknown) => true'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect(
        'function isNumber(u: unknown): u is number { return typeof u === "number" }',
      ),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect(
        'function isBoolean(u: unknown): u is boolean { return typeof u === "boolean" }',
      ),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isPromise(u: unknown) { return u instanceof Promise }'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect(
        'function isUndefined(u: unknown): u is undefined { return u === undefined }',
      ),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isNull(u: unknown): u is null { return u === null }'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isFunction(u: unknown) { return typeof u === "function" }'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isDate(u: unknown) { return u instanceof Date }'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isError(u: unknown) { return u instanceof Error }'),
      errors: [error('predicate')],
    },
    {
      ...ts,
      code: withEffect('function isNullish(u: unknown) { return u == null }'),
      errors: [error('predicate')],
    },
  ],
});
