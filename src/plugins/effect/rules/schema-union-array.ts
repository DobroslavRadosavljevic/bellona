import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, isArrayExpressionArgument } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const schemaUnionArrayName = bnRuleName('effect', 'schema-union-array');

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
      array: 'Use {{replacement}} instead of a variadic Schema.{{name}}(...) call.',
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
