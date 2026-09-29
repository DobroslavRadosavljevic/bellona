import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { programImportsEffect } from './bindings.ts';
import { isTestFile, matchesAllow } from './filename.ts';

export const DEFAULT_ENTRY_ALLOW = [
  '/main.ts',
  '/server.ts',
  '/index.ts',
  '/app.ts',
  '/runtime.ts',
];

export const ALLOW_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
  },
} as const;

export const ENTRY_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    entry: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
  },
} as const;

const STRING_LIST = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  uniqueItems: true,
} as const;

/** `allow` (file paths) plus `callees` (call names to skip). */
export const CALLEES_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { allow: STRING_LIST, callees: STRING_LIST },
} as const;

/** CLI handlers run once for each process, so a span on them is useful. */
export const DEFAULT_TRACED_CALLEES = ['Command.make', 'Command.withHandler'];

export const DEFAULT_CALLEES_OPTIONS = [{ allow: [], callees: DEFAULT_TRACED_CALLEES }];

export const DEFAULT_SIGNAL_APIS = ['fetch'];

/** `allow` (file paths) plus `apis` (functions that take an `AbortSignal`). */
export const SIGNAL_APIS_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { allow: STRING_LIST, apis: STRING_LIST },
} as const;

export const DEFAULT_SIGNAL_APIS_OPTIONS = [{ allow: [], apis: DEFAULT_SIGNAL_APIS }];

export function readCalleeList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'callees', DEFAULT_TRACED_CALLEES);
}

export function readSignalApiList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'apis', DEFAULT_SIGNAL_APIS);
}

export const DEFAULT_ALLOW_OPTIONS = [{ allow: [] }];

export const DEFAULT_ENTRY_OPTIONS = [{ allow: [], entry: DEFAULT_ENTRY_ALLOW }];

export function readAllowList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'allow', []);
}

export function readEntryList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'entry', DEFAULT_ENTRY_ALLOW);
}

export function shouldSkipEffectFile(context: Context): boolean {
  return (
    !programImportsEffect(context.sourceCode.ast) ||
    matchesAllow(context.filename, readAllowList(context))
  );
}

export function shouldSkipEffectStyleFile(context: Context): boolean {
  return shouldSkipEffectFile(context) || isTestFile(context.filename);
}

export function shouldSkipNonTestEffectFile(context: Context): boolean {
  return shouldSkipEffectFile(context) || !isTestFile(context.filename);
}

export function shouldSkipRunPromiseFile(context: Context): boolean {
  if (shouldSkipEffectStyleFile(context)) {
    return true;
  }
  const extra = readAllowList(context);
  const entry = readEntryList(context);
  return matchesAllow(context.filename, [...entry, ...extra]);
}
