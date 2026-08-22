import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { programImportsElysia } from './elysia.ts';
import {
  isRoutesIndexFile,
  isRoutesLeafFile,
  isTestFile,
  isUnderModulesDir,
  isUnderPluginsDir,
  isUnderRoutesDir,
  matchesAllow,
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

export function shouldSkipRouteFactoryFile(context: Context): boolean {
  const inScope = isUnderModulesDir(context.filename) || isUnderRoutesDir(context.filename);
  return (
    !inScope ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, readAllowList(context))
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
