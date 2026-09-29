import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  isSchemaValue,
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

/** v4 keeps these names for transformations: `Schema.decode({ decode, encode })`. */
const TRANSFORM_DECODERS = new Set(['decode', 'encode']);

/**
 * True when a `Schema.decode` / `Schema.encode` argument is a schema, which is the v3 form.
 * v4 takes a transformation: an object literal, `SchemaTransformation.trim()`, or a
 * variable. Only a `Schema.*` value or a PascalCase name (`User`) reads as a schema.
 */
function isV3DecoderArgument(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  if (node?.type === 'Identifier') {
    return /^[A-Z]/u.test(node.name);
  }
  return isSchemaValue(node, bindings);
}

export const preferDecodeUnknownEffectName = bnRuleName('prefer-decode-unknown');

export const preferDecodeUnknownEffect: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Use Schema.decodeUnknownEffect / decodeEffect instead of v3 Effect decoder names',
    },
    messages: {
      decoder: agentDiagnostic({
        problem:
          'This calls `Schema.{{name}}`. Effect v4 renamed decode/encode helpers to `*Effect` / `*Exit`.',
        why: 'The old names are v3. The v4 names make the Effect/Exit channel obvious.',
        fix: 'Replace `Schema.{{name}}` with `{{replacement}}`. v4 `Schema.decode(transformation)` / `Schema.encode(transformation)` are not this rule.',
        avoid: 'Do not keep the old name behind an alias. Do not disable the rule.',
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
        for (const [name, replacement] of LEGACY_DECODERS) {
          if (!isModuleCall(node, bindings, 'schema', name)) {
            continue;
          }
          if (
            TRANSFORM_DECODERS.has(name) &&
            !isV3DecoderArgument(getCallArgument(node, 0), bindings)
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
