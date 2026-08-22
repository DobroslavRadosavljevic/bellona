import type { Context } from '@oxlint/plugins';

import {
  isJsBoolean,
  isJsNumber,
  isJsPlainObject,
  isJsString,
  type JsonObject,
} from './js-kind.ts';

/**
 * Read a JSON object option for this file. Call from visitors/`before`, not from
 * the `createOnce` closure — that callback runs once for the process.
 */
export function objectOptionAt(context: Context, index: number): JsonObject | undefined {
  const value = context.options[index];
  if (!isJsPlainObject(value)) {
    return undefined;
  }
  return value;
}

export function integerField(
  object: JsonObject | undefined,
  key: string,
  fallback: number,
): number {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  if (isJsNumber(value) && Number.isInteger(value)) {
    return value;
  }
  return fallback;
}

export function stringField(object: JsonObject | undefined, key: string, fallback: string): string {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  return isJsString(value) ? value : fallback;
}

export function stringListField(
  object: JsonObject | undefined,
  key: string,
  fallback: readonly string[],
): readonly string[] {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  if (!Array.isArray(value)) {
    return fallback;
  }
  const strings: string[] = [];
  for (const item of value) {
    if (isJsString(item)) {
      strings.push(item);
    }
  }
  return strings;
}

export function booleanField(
  object: JsonObject | undefined,
  key: string,
  fallback: boolean,
): boolean {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  return isJsBoolean(value) ? value : fallback;
}

export interface NamedImportHint {
  component: string;
  from: string;
}

/** Read `{ tag: { component, from } }` maps from a JSON object option field. */
export function namedImportHintMap(
  object: JsonObject | undefined,
  key: string,
): ReadonlyMap<string, NamedImportHint> {
  const hints = new Map<string, NamedImportHint>();
  if (object === undefined) {
    return hints;
  }
  const value = object[key];
  if (!isJsPlainObject(value)) {
    return hints;
  }
  for (const [tag, hint] of Object.entries(value)) {
    if (!isJsPlainObject(hint)) {
      continue;
    }
    const component = hint['component'];
    const from = hint['from'];
    if (isJsString(component) && isJsString(from)) {
      hints.set(tag.toLowerCase(), { component, from });
    }
  }
  return hints;
}
