import { preferPredicateName } from '../../../../src/plugins/effect/rules/prefer-predicate.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function localGuard(name: string, replacement: string) {
  return { messageId: 'predicate' as const, data: { name, replacement } };
}

runEffectRule(preferPredicateName, {
  valid: [
    { ...ts, code: withEffect('if (Predicate.isString(x)) { x }') },
    { ...ts, code: withEffect('if (Predicate.isObject(x)) { x }') },
    { ...ts, code: withEffect('if (Predicate.isObjectKeyword(x)) { x }') },
    { ...ts, code: withEffect('if (Predicate.isNullish(x)) { x }') },
    { ...ts, code: withEffect('if (Predicate.isNotNullish(x)) { x }') },
    { ...ts, code: withEffect('if (Predicate.isReadonlyObject(x)) { x }') },
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
      errors: [localGuard('isString', 'Predicate.isString')],
    },
    {
      ...ts,
      code: withEffect('const isObject = (u: unknown) => u !== null && typeof u === "object"'),
      errors: [localGuard('isObject', 'Predicate.isObject')],
    },
    {
      ...ts,
      code: withEffect(
        'function isRecord(u: unknown): u is Record<string, unknown> { return u !== null && typeof u === "object" && !Array.isArray(u) }',
      ),
      errors: [localGuard('isRecord', 'Predicate.isObject')],
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
      errors: [localGuard('isNullish', 'Predicate.isNullish')],
    },
    {
      ...ts,
      code: withEffect('function isNullable(u: unknown) { return u == null }'),
      errors: [localGuard('isNullable', 'Predicate.isNullish')],
    },
    {
      ...ts,
      code: withEffect('function isNotNullable(u: unknown) { return u != null }'),
      errors: [localGuard('isNotNullable', 'Predicate.isNotNullish')],
    },
    {
      ...ts,
      code: withEffect('function isReadonlyRecord(u: unknown) { return true }'),
      errors: [localGuard('isReadonlyRecord', 'Predicate.isReadonlyObject')],
    },
    {
      ...ts,
      code: withEffect(
        'export const isRecord = function (u: unknown) { return Predicate.isObject(u) }',
      ),
      errors: [localGuard('isRecord', 'Predicate.isObject')],
    },
  ],
});
