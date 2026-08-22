import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { isSchemaName } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipZodFile } from '../options.ts';

const ZOD_SCHEMA_BUILDERS = new Set([
  'object',
  'strictObject',
  'looseObject',
  'string',
  'number',
  'int',
  'int32',
  'int64',
  'uint32',
  'float32',
  'float64',
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
  'nan',
  'array',
  'tuple',
  'record',
  'partialRecord',
  'looseRecord',
  'map',
  'set',
  'enum',
  'nativeEnum',
  'literal',
  'union',
  'xor',
  'discriminatedUnion',
  'intersection',
  'promise',
  'function',
  'lazy',
  'instanceof',
  'custom',
  'file',
  'json',
  'templateLiteral',
  'preprocess',
  'pipe',
  'codec',
  'transform',
  'email',
  'url',
  'httpUrl',
  'uuid',
  'guid',
  'cuid',
  'cuid2',
  'ulid',
  'nanoid',
  'jwt',
  'base64',
  'base64url',
  'hex',
  'hash',
  'emoji',
  'ipv4',
  'ipv6',
  'cidrv4',
  'cidrv6',
  'hostname',
  'e164',
  'mac',
  'creditCard',
]);

const ZOD_ISO_METHODS = new Set(['date', 'time', 'datetime', 'duration']);

const ZOD_COERCE_METHODS = new Set(['string', 'number', 'boolean', 'bigint', 'date']);

function isZodNamespaceCall(
  object: ESTree.Expression,
  method: string | undefined,
  namespace: string,
  methods: ReadonlySet<string>,
): boolean {
  if (object.type !== 'MemberExpression' || method === undefined) {
    return false;
  }
  const root = unwrapExpression(object.object);
  return (
    root?.type === 'Identifier' &&
    root.name === 'z' &&
    getStaticPropertyName(object.property) === namespace &&
    methods.has(method)
  );
}

function isZodSchemaBuilderCall(init: ESTree.Expression | undefined): boolean {
  let current = unwrapExpression(init);

  while (current?.type === 'CallExpression') {
    const callee = unwrapExpression(current.callee);
    if (callee?.type !== 'MemberExpression') {
      return false;
    }

    const method = getStaticPropertyName(callee.property);
    const object = unwrapExpression(callee.object);
    if (object === undefined) {
      return false;
    }

    if (object.type === 'Identifier' && object.name === 'z') {
      return method !== undefined && ZOD_SCHEMA_BUILDERS.has(method);
    }

    if (isZodNamespaceCall(object, method, 'iso', ZOD_ISO_METHODS)) {
      return true;
    }

    if (isZodNamespaceCall(object, method, 'coerce', ZOD_COERCE_METHODS)) {
      return true;
    }

    if (object.type === 'CallExpression') {
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
