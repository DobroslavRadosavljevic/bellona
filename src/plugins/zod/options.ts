import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { isTestFile, matchesAllow } from './filename.ts';

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

export function shouldSkipZodFile(context: Context): boolean {
  return isTestFile(context.filename) || matchesAllow(context.filename, readAllowList(context));
}
