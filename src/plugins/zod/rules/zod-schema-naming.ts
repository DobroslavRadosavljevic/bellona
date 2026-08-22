import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { isSchemaName } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipZodFile } from '../options.ts';

const ZOD_SCHEMA_BUILDERS = new Set([
  'object',
  'string',
  'number',
  'boolean',
  'bigint',
  'date',
  'symbol',
  'undefined',
  'null',
  'void',
  'any',
  'unknown',
  'never',
  'array',
  'tuple',
  'record',
  'map',
  'set',
  'enum',
  'nativeEnum',
  'literal',
  'union',
  'discriminatedUnion',
  'intersection',
  'promise',
  'function',
  'lazy',
  'instanceof',
  'custom',
  'file',
  'json',
  'email',
  'url',
  'uuid',
  'cuid',
  'cuid2',
  'ulid',
  'nanoid',
  'jwt',
  'base64',
  'base64url',
  'emoji',
  'ipv4',
  'ipv6',
  'cidrv4',
  'cidrv6',
]);

function isZodSchemaBuilderCall(init: ESTree.Expression | undefined): boolean {
  let current = unwrapExpression(init);

  while (current?.type === 'CallExpression') {
    const callee = unwrapExpression(current.callee);
    if (callee?.type !== 'MemberExpression') {
      return false;
    }

    const method = getStaticPropertyName(callee.property);
    const object = unwrapExpression(callee.object);

    if (object?.type === 'Identifier' && object.name === 'z') {
      return method !== undefined && ZOD_SCHEMA_BUILDERS.has(method);
    }

    if (object?.type === 'CallExpression') {
      current = object;
      continue;
    }

    return false;
  }

  return false;
}

export const zodSchemaNamingName = vmRuleName('zod-schema-naming');

export const zodSchemaNaming: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require exported Zod schemas to use PascalCase names ending in Schema',
    },
    messages: {
      naming: 'Exported Zod schemas must use PascalCase names ending in `Schema`.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const checkExportName = (
      node: ESTree.Node,
      name: string | undefined,
      init: ESTree.Expression | undefined,
    ) => {
      if (name === undefined || isSchemaName(name) || init === undefined) {
        return;
      }

      if (isZodSchemaBuilderCall(init)) {
        context.report({ messageId: 'naming', node });
      }
    };

    return {
      before() {
        if (shouldSkipZodFile(context)) {
          return false;
        }
      },
      ExportNamedDeclaration(node) {
        const { declaration } = node;
        if (declaration?.type !== 'VariableDeclaration') {
          return;
        }
        for (const declarator of declaration.declarations) {
          if (declarator.id.type === 'Identifier') {
            checkExportName(declarator.id, declarator.id.name, declarator.init ?? undefined);
          }
        }
      },
    };
  },
});
