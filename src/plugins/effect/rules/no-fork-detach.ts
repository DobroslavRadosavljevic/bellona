import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, parentOf, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  generatorFromEffectGenOrFn,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { matchesAllow } from '../filename.ts';
import {
  DEFAULT_ENTRY_OPTIONS,
  ENTRY_OPTION_SCHEMA,
  readEntryList,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noForkDetachName = bnRuleName('no-fork-detach');

/** The Effect that a generator builds: `Effect.gen(fn)` or `Effect.fn(…)(fn)()`. */
function effectOfGenerator(fn: ESTree.Node): ESTree.Node | undefined {
  const call = parentOf(fn);
  if (call?.type !== 'CallExpression') {
    return undefined;
  }
  const invocation = parentOf(call);
  if (invocation?.type === 'CallExpression' && unwrapExpression(invocation.callee) === call) {
    return invocation;
  }
  return call;
}

/** Follow `.pipe(…)` and parentheses up from an Effect to the node that uses it. */
function outerEffect(node: ESTree.Node) {
  let current = node;
  let parent = parentOf(current);
  while (parent !== undefined) {
    if (unwrapExpression(parent) === current && parent.type !== 'CallExpression') {
      current = parent;
    } else if (
      parent.type === 'MemberExpression' &&
      parent.object === current &&
      getStaticPropertyName(parent.property) === 'pipe' &&
      parentOf(parent)?.type === 'CallExpression'
    ) {
      current = parentOf(parent) ?? parent;
    } else {
      break;
    }
    parent = parentOf(current);
  }
  return { effect: current, parent };
}

/** True when `node` runs directly in the generator that builds a `Layer.effect*` service. */
function isInLayerConstruction(node: ESTree.Node, bindings: EffectBindings): boolean {
  let fn = parentOf(node);
  while (fn !== undefined && !isFunctionLike(fn)) {
    fn = parentOf(fn);
  }
  if (fn === undefined || generatorFromEffectGenOrFn(fn, bindings) !== fn) {
    return false;
  }
  const built = effectOfGenerator(fn);
  if (built === undefined) {
    return false;
  }
  const { effect, parent } = outerEffect(built);
  if (parent?.type !== 'CallExpression' || !parent.arguments.some((arg) => arg === effect)) {
    return false;
  }
  return (
    isModuleCall(parent, bindings, 'layer', 'effect') ||
    isModuleCall(parent, bindings, 'layer', 'effectDiscard') ||
    isModuleCall(parent, bindings, 'layer', 'effectContext')
  );
}

export const noForkDetach: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Effect.forkDetach outside entry files, and Effect.forkChild while a layer is built',
    },
    messages: {
      detach: agentDiagnostic({
        problem:
          '`Effect.forkDetach` starts a fiber that no scope owns. Shutdown does not stop it, and its failures are not seen.',
        why: 'A detached fiber is attached to the global scope. It keeps running after the request or the service is gone, and it can leak work and connections.',
        fix: 'In a layer, use `Effect.forkScoped` so the layer scope stops the fiber. In a service method, run it with a `FiberSet` / `FiberMap` from the layer, or `Effect.forkIn(scope)`. Add the file to `entry` if it is a process entry.',
        avoid: 'Do not replace it with `Effect.runFork`. Do not disable the rule.',
      }),
      childInLayer: agentDiagnostic({
        problem:
          '`Effect.forkChild` runs while a layer is built. The child fiber stops as soon as the layer is built.',
        why: 'A child fiber belongs to the fiber that forks it. The fiber that builds the layer ends after construction, so Effect interrupts the child at once.',
        fix: 'Use `yield* Effect.forkScoped(effect)`. The layer scope keeps the fiber alive and stops it when the layer is released.',
        avoid: 'Do not use `Effect.forkDetach` instead. Do not disable the rule.',
      }),
    },
    schema: [ENTRY_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ENTRY_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let isEntry: boolean;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        isEntry = matchesAllow(context.filename, readEntryList(context));
      },
      MemberExpression(node) {
        check(node);
      },
      Identifier(node) {
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node)
        ) {
          return;
        }
        check(node);
      },
    };

    function check(node: ESTree.Node): void {
      if (isModuleMember(node, bindings, 'effect', 'forkDetach')) {
        if (!isEntry) {
          context.report({ messageId: 'detach', node });
        }
        return;
      }
      if (
        isModuleMember(node, bindings, 'effect', 'forkChild') &&
        isInLayerConstruction(node, bindings)
      ) {
        context.report({ messageId: 'childInLayer', node });
      }
    }
  },
});
