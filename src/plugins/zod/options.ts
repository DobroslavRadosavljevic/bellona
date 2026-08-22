import type { Context, ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { isTestFile, matchesAllow } from './filename.ts';

/** True when the file imports from `zod` or a `zod/` subpath. */
export function programImportsZod(program: ESTree.Program | undefined): boolean {
  if (program === undefined) {
    return false;
  }
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (isJsString(source) && (source === 'zod' || source.startsWith('zod/'))) {
      return true;
    }
  }
  return false;
}

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
  return (
    !programImportsZod(context.sourceCode.ast) ||
    isTestFile(context.filename) ||
    matchesAllow(context.filename, readAllowList(context))
  );
}
