import type { ESTree } from '@oxlint/plugins';

const objectTag = Object.prototype.toString;

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type RuntimeScalar =
  | JsonValue
  | ESTree.Node
  | string
  | number
  | boolean
  | bigint
  | symbol
  | RegExp
  | null
  | undefined;

export function isJsString(value: RuntimeScalar): value is string {
  return objectTag.call(value) === '[object String]';
}

export function isJsNumber(value: RuntimeScalar): value is number {
  return objectTag.call(value) === '[object Number]';
}

export function isJsBoolean(value: RuntimeScalar): value is boolean {
  return objectTag.call(value) === '[object Boolean]';
}

export function isJsPlainObject(value: RuntimeScalar): value is JsonObject {
  return (
    value !== null &&
    value !== undefined &&
    !Array.isArray(value) &&
    objectTag.call(value) === '[object Object]'
  );
}
