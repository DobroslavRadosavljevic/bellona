import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getCallArgument } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

const LEGACY_DECODERS = new Map<string, string>([
  ['decodeUnknown', 'Schema.decodeUnknownEffect'],
  ['encodeUnknown', 'Schema.encodeUnknownEffect'],
  ['decodeUnknownEither', 'Schema.decodeUnknownExit'],
  ['encodeUnknownEither', 'Schema.encodeUnknownExit'],
  ['decodeEither', 'Schema.decodeExit'],
  ['encodeEither', 'Schema.encodeExit'],
  ['decode', 'Schema.decodeEffect'],
  ['encode', 'Schema.encodeEffect'],
]);

const TRANSFORM_DECODERS = new Set(['decode', 'encode']);

export const preferDecodeUnknownEffectName = vmRuleName('prefer-decode-unknown-effect');

export const preferDecodeUnknownEffect: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Use Schema.decodeUnknownEffect / decodeEffect instead of v3 Effect decoder names',
    },
    messages: {
      decoder: 'Use {{replacement}} instead of Schema.{{name}}.',
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
        for (const [name, replacement] of LEGACY_DECODERS) {
          if (!isModuleCall(node, bindings, 'schema', name)) {
            continue;
          }
          if (
            TRANSFORM_DECODERS.has(name) &&
            getCallArgument(node, 0)?.type === 'ObjectExpression'
          ) {
            return;
          }
          context.report({
            messageId: 'decoder',
            node,
            data: { name, replacement },
          });
          return;
        }
      },
      MemberExpression(node) {
        const parent = node.parent;
        if (parent?.type === 'CallExpression' && parent.callee === node) {
          return;
        }
        for (const [name, replacement] of LEGACY_DECODERS) {
          if (TRANSFORM_DECODERS.has(name)) {
            continue;
          }
          if (isModuleMember(node, bindings, 'schema', name)) {
            context.report({
              messageId: 'decoder',
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
