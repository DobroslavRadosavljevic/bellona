import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, isArrayExpressionArgument } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const schemaUnionArrayName = bnRuleName('schema-union-array');

interface VariadicCall {
  readonly replacement: string;
  readonly minArgs: number;
}

const VARIADIC = new Map<string, VariadicCall>([
  ['Union', { replacement: 'Schema.Union([A, B])', minArgs: 1 }],
  ['Tuple', { replacement: 'Schema.Tuple([A, B])', minArgs: 1 }],
  ['TemplateLiteral', { replacement: 'Schema.TemplateLiteral([A, B])', minArgs: 1 }],
  ['Literal', { replacement: 'Schema.Literals(["a", "b"])', minArgs: 2 }],
]);

export const schemaUnionArray: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Schema.Union, Tuple, TemplateLiteral, and multi Literal to take an array',
    },
    messages: {
      array: agentDiagnostic({
        problem:
          'This calls `Schema.{{name}}(...)` with variadic members. v4 takes a single array. Use `{{replacement}}`.',
        why: '`Schema.Union(A, B)` is v3. v4 is `Schema.Union([A, B])`. Multi `Schema.Literal` became `Schema.Literals([...])`.',
        fix: 'Replace with `{{replacement}}` (example: `Schema.Union([A, B])`, `Schema.Literals(["a", "b"])`, array form for Tuple / TemplateLiteral).',
        avoid: 'Do not keep rest arguments. Do not disable the rule.',
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
        for (const [name, config] of VARIADIC) {
          if (!isModuleCall(node, bindings, 'schema', name)) {
            continue;
          }
          if (node.arguments.length < config.minArgs) {
            return;
          }
          if (isArrayExpressionArgument(node, 0)) {
            return;
          }
          const first = getCallArgument(node, 0);
          if (name !== 'Literal' && node.arguments.length === 1 && first?.type === 'Identifier') {
            return;
          }
          if (name === 'Literal' && node.arguments.length < 2) {
            return;
          }
          context.report({
            messageId: 'array',
            node,
            data: { name, replacement: config.replacement },
          });
          return;
        }
      },
    };
  },
});
