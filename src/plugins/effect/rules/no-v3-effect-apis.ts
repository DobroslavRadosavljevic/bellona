import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleMember, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

const EFFECT_REPLACEMENTS = new Map<string, string>([
  ['catchAll', 'Effect.catch'],
  ['catchAllCause', 'Effect.catchCause'],
  ['catchAllDefect', 'Effect.catchDefect'],
  ['catchSome', 'Effect.catchFilter'],
  ['catchSomeCause', 'Effect.catchCauseFilter'],
  ['catchSomeDefect', 'removed (typed defects only)'],
  ['async', 'Effect.callback'],
  ['asyncEffect', 'Effect.callback'],
  ['either', 'Effect.result'],
  ['zipRight', 'Effect.andThen'],
  ['zipLeft', 'Effect.zip + Effect.map'],
  ['fork', 'Effect.forkChild'],
  ['forkDaemon', 'Effect.forkDetach'],
  ['forkAll', 'removed'],
  ['forkWithErrorHandler', 'removed'],
]);

const LAYER_REPLACEMENTS = new Map<string, string>([
  ['scoped', 'Layer.effect'],
  ['scopedDiscard', 'Layer.effectDiscard'],
  ['scopedContext', 'Layer.effectContext'],
  ['catchAll', 'Layer.catch'],
  ['catchAllCause', 'Layer.catchCause'],
]);

const STREAM_REPLACEMENTS = new Map<string, string>([['async', 'Stream.callback']]);

const SCOPE_REPLACEMENTS = new Map<string, string>([['extend', 'Scope.provide']]);

export const noV3EffectApisName = bnRuleName('effect', 'no-v3-apis');

function v3ApiOf(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): { api: string; replacement: string } | undefined {
  for (const [name, replacement] of EFFECT_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'effect', name)) {
      return { api: `Effect.${name}`, replacement };
    }
  }
  for (const [name, replacement] of LAYER_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'layer', name)) {
      return { api: `Layer.${name}`, replacement };
    }
  }
  for (const [name, replacement] of STREAM_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'stream', name)) {
      return { api: `Stream.${name}`, replacement };
    }
  }
  for (const [name, replacement] of SCOPE_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'scope', name)) {
      return { api: `Scope.${name}`, replacement };
    }
  }
  return undefined;
}

function isCalleeOfCall(node: ESTree.Node): boolean {
  const parent = node.parent;
  return parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node;
}

export const noV3EffectApis: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Effect v3 combinators that were renamed or removed in Effect v4',
    },
    messages: {
      renamed: 'Use {{replacement}} instead of {{api}}.',
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
        const found = v3ApiOf(unwrapExpression(node.callee), bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
      MemberExpression(node) {
        if (isCalleeOfCall(node)) {
          return;
        }
        const found = v3ApiOf(node, bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
      Identifier(node) {
        if (isCalleeOfCall(node)) {
          return;
        }
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed)
        ) {
          return;
        }
        const found = v3ApiOf(node, bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
    };
  },
});
