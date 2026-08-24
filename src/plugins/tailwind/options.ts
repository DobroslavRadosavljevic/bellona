import type { Context } from '@oxlint/plugins';

import { integerField, objectOptionAt, stringListField } from '../../lib/options.ts';
import { isTestFile, matchesAllow } from './filename.ts';

export const DEFAULT_MIN_UTILITIES = 2;

export const DEFAULT_ALLOWED_CALLEES = ['tv', 'createTV'] as const;

export const ALLOW_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    minUtilities: { type: 'integer', minimum: 1 },
    allowedCallees: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
  },
} as const;

export const DEFAULT_TAILWIND_OPTIONS = [
  {
    allow: [],
    minUtilities: DEFAULT_MIN_UTILITIES,
    allowedCallees: [...DEFAULT_ALLOWED_CALLEES],
  },
];

export function readAllowList(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'allow', []);
}

export function readMinUtilities(context: Context): number {
  return integerField(objectOptionAt(context, 0), 'minUtilities', DEFAULT_MIN_UTILITIES);
}

export function readAllowedCallees(context: Context): readonly string[] {
  return stringListField(objectOptionAt(context, 0), 'allowedCallees', DEFAULT_ALLOWED_CALLEES);
}

export function shouldSkipTailwindFile(context: Context): boolean {
  return isTestFile(context.filename) || matchesAllow(context.filename, readAllowList(context));
}
