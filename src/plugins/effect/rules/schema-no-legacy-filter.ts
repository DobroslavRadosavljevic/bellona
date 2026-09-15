import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

const LEGACY_METHODS = new Set([
  'filter',
  'filterEffect',
  'optionalWith',
  'positive',
  'negative',
  'nonNegative',
  'nonPositive',
  'pattern',
  'rename',
]);

const LEGACY_SCHEMA_EXPORTS = new Map<string, string>([
  ['filter', 'Schema.check / Schema.refine'],
  [
    'filterEffect',
    'Schema.decode({ decode: SchemaGetter.checkEffect(...), encode: SchemaGetter.passthrough() })',
  ],
  ['optionalWith', 'Schema.optionalKey / withDecodingDefaultType*'],
  ['positive', 'Schema.check(Schema.isGreaterThan(0))'],
  ['negative', 'Schema.check(Schema.isLessThan(0))'],
  ['nonNegative', 'Schema.check(Schema.isGreaterThanOrEqualTo(0))'],
  ['nonPositive', 'Schema.check(Schema.isLessThanOrEqualTo(0))'],
  ['nonEmptyString', 'Schema.String.check(Schema.isNonEmpty())'],
  ['pattern', 'Schema.check(Schema.isPattern(regex))'],
  ['rename', 'Schema.encodeKeys'],
  ['encodedSchema', 'Schema.toEncoded'],
  ['typeSchema', 'Schema.toType'],
  ['encodedBoundSchema', 'Schema.toEncoded'],
  ['toArbitrary', 'Arbitrary.schema (effect/unstable/arbitrary)'],
]);

export const schemaNoLegacyFilterName = bnRuleName('schema-no-legacy-filter');

function isSchemaReceiver(
  node: ReturnType<typeof unwrapExpression>,
  bindings: EffectBindings,
): boolean {
  let current = node;
  while (current !== undefined) {
    if (current.type === 'Identifier' && bindings.namespaces.schema.has(current.name)) {
      return true;
    }
    if (current.type === 'MemberExpression') {
      current = unwrapExpression(current.object);
      continue;
    }
    if (current.type === 'CallExpression') {
      const callee = unwrapExpression(current.callee);
      if (callee?.type === 'MemberExpression') {
        current = unwrapExpression(callee.object);
        continue;
      }
      if (callee?.type === 'Identifier' && bindings.namespaces.schema.has(callee.name)) {
        return true;
      }
      return false;
    }
    return false;
  }
  return false;
}

export const schemaNoLegacyFilter: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Schema v3 filter / optionalWith / positive helpers; use .check in v4',
    },
    messages: {
      legacy: agentDiagnostic({
        problem:
          'This uses v3 Schema API `Schema.{{name}}`. The v4 replacement is `{{replacement}}`.',
        why: '`filter` / `filterEffect` / `optionalWith` / `positive` / `pattern` / `rename` / `encodedSchema` and friends were replaced by `Schema.check` / `Schema.refine` / `Schema.encodeKeys` / `Schema.toEncoded`.',
        fix: 'Replace `Schema.{{name}}` with `{{replacement}}` (example: `Schema.String.check(Schema.isNonEmpty())` instead of `nonEmptyString`).',
        avoid: 'Do not keep the v3 method on a renamed import. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        for (const [name, replacement] of LEGACY_SCHEMA_EXPORTS) {
          if (isModuleCall(node, bindings, 'schema', name)) {
            context.report({
              messageId: 'legacy',
              node,
              data: { name, replacement },
            });
            return;
          }
        }
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const method = getStaticPropertyName(callee.property);
        if (method === undefined || !LEGACY_METHODS.has(method)) {
          return;
        }
        if (!isSchemaReceiver(unwrapExpression(callee.object), bindings)) {
          return;
        }
        const replacement = LEGACY_SCHEMA_EXPORTS.get(method) ?? 'Schema.check';
        context.report({
          messageId: 'legacy',
          node,
          data: { name: method, replacement },
        });
      },
      MemberExpression(node) {
        const parent = node.parent;
        if (parent?.type === 'CallExpression' && parent.callee === node) {
          return;
        }
        for (const [name, replacement] of LEGACY_SCHEMA_EXPORTS) {
          if (isModuleMember(node, bindings, 'schema', name)) {
            context.report({
              messageId: 'legacy',
              node,
              data: { name, replacement },
            });
            return;
          }
        }
      },
    };
  },
});
