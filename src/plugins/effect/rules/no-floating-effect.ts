import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { pipeRoot, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isEffectExpression,
  isInEffectGenerator,
  isModuleCall,
  type BindingKind,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noFloatingEffectName = bnRuleName('no-floating-effect');

/** `Ref` / `Deferred` / `Fiber` operations that return an Effect. */
const HANDLE_EFFECTS: readonly { kind: BindingKind; names: readonly string[] }[] = [
  {
    kind: 'ref',
    names: ['set', 'update', 'getAndSet', 'getAndUpdate', 'setAndGet', 'updateAndGet', 'modify'],
  },
  {
    kind: 'deferred',
    names: ['succeed', 'fail', 'failCause', 'die', 'done', 'complete', 'completeWith', 'interrupt'],
  },
  { kind: 'fiber', names: ['interrupt', 'interruptAll', 'join', 'joinAll', 'awaitAll'] },
];

function isHandleEffectCall(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const root = pipeRoot(node);
  if (root?.type !== 'CallExpression') {
    return false;
  }
  return HANDLE_EFFECTS.some(({ kind, names }) =>
    names.some((name) => isModuleCall(root, bindings, kind, name)),
  );
}

export const noFloatingEffect: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow an Effect that is made but not yielded inside Effect.gen and Effect.fn generators',
    },
    messages: {
      floating: agentDiagnostic({
        problem: 'This statement makes an Effect but does not `yield*` it. The Effect never runs.',
        why: 'An Effect is a description of work. Inside a generator, only `yield*` runs it. A statement such as `Effect.log("x")` or `Ref.set(ref, 1)` makes a value and drops it.',
        fix: 'Write `yield* Effect.log("x")`. To run it in the background, write `yield* Effect.forkChild(effect)`. If the statement is not needed, remove it.',
        avoid: 'Do not add `void` in front of it. Do not disable the rule.',
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
      ExpressionStatement(node) {
        const expression = unwrapExpression(node.expression);
        if (
          !isEffectExpression(expression, bindings) &&
          !isHandleEffectCall(expression, bindings)
        ) {
          return;
        }
        if (!isInEffectGenerator(node, bindings)) {
          return;
        }
        context.report({ messageId: 'floating', node });
      },
    };
  },
});
