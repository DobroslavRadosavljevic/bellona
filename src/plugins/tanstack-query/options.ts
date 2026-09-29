import type { Context } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { QUERY_MODULES } from './evidence.ts';

export const OPTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
    queryClientNames: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
  },
} as const;
export const DEFAULT_OPTIONS = [{ allow: [], queryClientNames: ['queryClient'] }];

export function skipFile(context: Context, includeRouter = false): boolean {
  const path = context.filename.replaceAll('\\', '/');
  if (
    stringListField(objectOptionAt(context, 0), 'allow', []).some((part) =>
      path.includes(part.replaceAll('\\', '/')),
    )
  )
    return true;
  return !context.sourceCode.ast.body.some(
    (node) =>
      (node.type === 'ImportDeclaration' &&
        (QUERY_MODULES.has(String(node.source.value)) ||
          (includeRouter && node.source.value === '@tanstack/react-router'))) ||
      (node.type === 'ExportNamedDeclaration' &&
        node.source !== null &&
        QUERY_MODULES.has(String(node.source.value))),
  );
}
