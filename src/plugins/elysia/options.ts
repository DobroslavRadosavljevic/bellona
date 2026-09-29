import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { programImportsElysia } from './elysia.ts';
import {
  isRoutesIndexFile,
  isTestOrSpecFile,
  isRoutesLeafFile,
  isTestFile,
  isUnderPluginsDir,
  matchesAllow,
  slash,
} from './filename.ts';

export const DEFAULT_ENTRY_ALLOW = ['/main.ts', '/server.ts', '/index.ts', '/app.ts'];

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

export const DEFAULT_ALLOW_OPTIONS = [{ allow: [] }];

export function readAllowList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'allow', []);
}

export function shouldSkipElysiaFile(context: Context): boolean {
  return (
    !programImportsElysia(context.sourceCode.ast) ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, readAllowList(context))
  );
}

export function shouldSkipElysiaRoutesLeaf(context: Context): boolean {
  return !isRoutesLeafFile(context.filename) || shouldSkipElysiaFile(context);
}

export function shouldSkipElysiaRoutesIndex(context: Context): boolean {
  return !isRoutesIndexFile(context.filename) || shouldSkipElysiaFile(context);
}

export function shouldSkipElysiaPluginDir(context: Context): boolean {
  return !isUnderPluginsDir(context.filename) || shouldSkipElysiaFile(context);
}

/** Default directories for `no-elysia-factory-function`. */
export const DEFAULT_FACTORY_DIRECTORIES = ['/modules/', '/routes/'] as const;

/**
 * Skip unless the path contains one of `directories` (an empty list means every
 * path). Test files and `allow` matches are skipped.
 */
export function shouldSkipFactoryFunctionFile(context: Context): boolean {
  const directories = stringListField(
    objectOptionAt(context, 0),
    'directories',
    DEFAULT_FACTORY_DIRECTORIES,
  );
  const path = slash(context.filename);
  const inScope =
    directories.length === 0 || directories.some((directory) => path.includes(slash(directory)));
  return (
    !inScope ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, readAllowList(context))
  );
}

/** Run only on `*.test.*` / `*.spec.*` files that `allow` does not match. */
export function shouldSkipNonTestFile(context: Context): boolean {
  return (
    !isTestOrSpecFile(context.filename) || matchesAllow(context.filename, readAllowList(context))
  );
}

export function shouldSkipNamedElysiaPlugin(context: Context): boolean {
  const extra = readAllowList(context);
  const allow = [...DEFAULT_ENTRY_ALLOW, ...extra];
  return (
    !programImportsElysia(context.sourceCode.ast) ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, allow)
  );
}
