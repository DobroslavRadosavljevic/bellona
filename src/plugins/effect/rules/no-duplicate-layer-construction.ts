import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { normalizeSource } from '../module-refs.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noDuplicateLayerConstructionName = bnRuleName('no-duplicate-layer-construction');

/**
 * `Layer` functions that build a new layer from a constructor. Combinators such as
 * `provide`, `merge`, and `mergeAll` only wrap other layers. The layers they wrap keep
 * their identity, so a second copy of a combinator does not build a second resource.
 */
const LAYER_CONSTRUCTORS = [
  'effect',
  'effectContext',
  'effectDiscard',
  'sync',
  'syncContext',
  'suspend',
  'unwrap',
  'fromBuild',
];

/** The longest call text to show in the message. */
const MAX_CALL_TEXT = 80;

function isLayerName(name: string): boolean {
  return name.startsWith('layer') || name.endsWith('Layer');
}

export const noDuplicateLayerConstruction: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the same parameterized layer call two or more times in one file',
    },
    messages: {
      duplicate: agentDiagnostic({
        problem: '`{{call}}` is also written on line {{line}}. Each call makes a new layer object.',
        why: 'Effect v4 shares a layer only when it is the same object. Two calls make two objects, so the runtime builds the resource two times: two pools, two connections, two caches.',
        fix: 'Store the call one time in a module-level constant, such as `const PgLive = {{call}}`. Use that constant in each place.',
        avoid:
          'Do not change the arguments only to make the calls look different. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let firstLines: Map<string, number>;

    function isLayerCall(node: ESTree.CallExpression): boolean {
      if (node.arguments.length === 0) {
        return false;
      }
      if (LAYER_CONSTRUCTORS.some((name) => isModuleCall(node, bindings, 'layer', name))) {
        return true;
      }
      const callee = unwrapExpression(node.callee);
      if (callee?.type === 'Identifier') {
        return !bindings.named.has(callee.name) && isLayerName(callee.name);
      }
      if (callee?.type !== 'MemberExpression') {
        return false;
      }
      const object = unwrapExpression(callee.object);
      if (object?.type === 'Identifier' && bindings.namespaces.layer.has(object.name)) {
        return false;
      }
      const property = getStaticPropertyName(callee.property);
      return property !== undefined && isLayerName(property);
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        firstLines = new Map();
      },
      CallExpression(node) {
        if (!isLayerCall(node)) {
          return;
        }
        const call = normalizeSource(context.sourceCode.getText(node));
        const line = firstLines.get(call);
        if (line === undefined) {
          firstLines.set(call, node.loc.start.line);
          return;
        }
        const shown = call.length > MAX_CALL_TEXT ? `${call.slice(0, MAX_CALL_TEXT)}…` : call;
        context.report({
          messageId: 'duplicate',
          node,
          data: { call: shown, line: String(line) },
        });
      },
    };
  },
});
