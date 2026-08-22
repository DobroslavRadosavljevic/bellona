import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { isTestFile, matchesAllow } from './filename.ts';
import { programImportsTanstackRouter } from './router.ts';

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

/** Skip files without a TanStack Router import, test files, and `allow` matches. */
export function shouldSkipRouterFile(context: Context): boolean {
  const allow = readAllowList(context);
  return (
    !programImportsTanstackRouter(context.sourceCode.ast) ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, allow)
  );
}
