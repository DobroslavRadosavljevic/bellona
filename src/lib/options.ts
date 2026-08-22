import type { Context } from '@oxlint/plugins';

/**
 * Read a JSON object option for this file. Call from visitors/`before`, not from
 * the `createOnce` closure — that callback runs once for the process.
 */
export function objectOptionAt(
  context: Context,
  index: number,
): Record<string, unknown> | undefined {
  const value = context.options[index];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value;
}

export function integerField(
  object: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
): number {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

export function stringField(
  object: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  return typeof value === 'string' ? value : fallback;
}

export function stringListField(
  object: Record<string, unknown> | undefined,
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
    if (typeof item === 'string') {
      strings.push(item);
    }
  }
  return strings;
}

export function booleanField(
  object: Record<string, unknown> | undefined,
  key: string,
  fallback: boolean,
): boolean {
  if (object === undefined) {
    return fallback;
  }
  const value = object[key];
  return typeof value === 'boolean' ? value : fallback;
}
