import type { Context } from '@oxlint/plugins';

import { isJsPlainObject, isJsString } from '../../lib/js-kind.ts';
import { booleanField, objectOptionAt, stringListField } from '../../lib/options.ts';
import { matchesAllow } from './filename.ts';

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

/** Skip a file that matches `{ allow }` (a path substring or a basename). */
export function isAllowedFile(context: Context): boolean {
  return matchesAllow(context.filename, readAllowList(context));
}

export interface NoUselessReexportOptions {
  allow: readonly string[];
  allowRenames: boolean;
}

export const DEFAULT_ALLOW_RENAMES = true;

export function readNoUselessReexportOptions(context: Context): NoUselessReexportOptions {
  const object = objectOptionAt(context, 0);
  return {
    allow: stringListField(object, 'allow', []),
    allowRenames: booleanField(object, 'allowRenames', DEFAULT_ALLOW_RENAMES),
  };
}

export interface FileLayout {
  readonly root: string;
  readonly allow: readonly string[];
  readonly message: string | null;
}

export interface RequireFileLayoutOptions {
  readonly layouts: readonly FileLayout[];
  readonly servicesFolderContents: boolean;
  readonly serviceDirectories: readonly string[];
}

export function readRequireFileLayoutOptions(context: Context): RequireFileLayoutOptions {
  const object = objectOptionAt(context, 0);
  const layouts: FileLayout[] = [];
  const raw = object?.['layouts'];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!isJsPlainObject(entry)) continue;
      const root = entry['root'];
      const message = entry['message'];
      if (!isJsString(root)) continue;
      layouts.push({
        root,
        allow: stringListField(entry, 'allow', []),
        message: isJsString(message) ? message : null,
      });
    }
  }
  return {
    layouts,
    servicesFolderContents: booleanField(object, 'servicesFolderContents', true),
    serviceDirectories: stringListField(object, 'serviceDirectories', []),
  };
}

export const DEFAULT_GENERIC_MODULE_NAMES = [
  'utils',
  'util',
  'helpers',
  'helper',
  'common',
  'misc',
  'stuff',
  'things',
] as const;

export function readGenericModuleNames(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'names', DEFAULT_GENERIC_MODULE_NAMES);
}
