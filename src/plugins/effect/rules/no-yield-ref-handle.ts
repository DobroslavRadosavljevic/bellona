import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression, walkFunctionBody } from '../ast.ts';
import {
  collectEffectBindings,
  generatorFromEffectGenOrFn,
  isModuleCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noYieldRefHandleName = bnRuleName('no-yield-ref-handle');

function yieldCallee(node: ESTree.YieldExpression): ESTree.CallExpression | undefined {
  const argument = unwrapExpression(node.argument);
  return argument?.type === 'CallExpression' ? argument : undefined;
}

function markHandle(
  handles: Map<string, string>,
  node: ESTree.VariableDeclarator,
  kind: string,
): void {
  if (node.id.type === 'Identifier') {
    handles.set(node.id.name, kind);
  }
}

export const noYieldRefHandle: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Do not yield Ref, Fiber, or Deferred handles; use Ref.get, Fiber.join, Deferred.await',
    },
    messages: {
      handle: agentDiagnostic({
        problem:
          'This generator `yield*`s a `{{kind}}` handle. Handles are not Effects. Use `{{replacement}}`.',
        why: '`Ref` / `Fiber` / `Deferred` values are handles. `yield*` on them does not get/join/await.',
        fix: 'Call `{{replacement}}` (examples: `yield* Ref.get(ref)`, `yield* Fiber.join(fiber)`, `yield* Deferred.await(deferred)`).',
        avoid: 'Do not `yield* ref` after wrapping. Do not disable the rule.',
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
      FunctionExpression(node) {
        inspectGenerator(node);
      },
      FunctionDeclaration(node) {
        inspectGenerator(node);
      },
    };

    function inspectGenerator(fn: ESTree.Node): void {
      const generator = generatorFromEffectGenOrFn(fn, bindings);
      if (generator !== fn) {
        return;
      }
      const handles = new Map<string, string>();
      walkFunctionBody(fn, (node) => {
        if (node.type !== 'VariableDeclarator' || node.init === undefined || node.init === null) {
          return;
        }
        const init = unwrapExpression(node.init);
        if (init?.type === 'YieldExpression' && init.delegate === true) {
          const call = yieldCallee(init);
          if (call !== undefined) {
            if (
              isModuleCall(call, bindings, 'ref', 'make') ||
              isModuleCall(call, bindings, 'ref', 'makeUnsafe')
            ) {
              markHandle(handles, node, 'Ref');
            }
            if (isModuleCall(call, bindings, 'deferred', 'make')) {
              markHandle(handles, node, 'Deferred');
            }
            if (
              isModuleCall(call, bindings, 'effect', 'forkChild') ||
              isModuleCall(call, bindings, 'effect', 'forkDetach') ||
              isModuleCall(call, bindings, 'effect', 'forkScoped') ||
              isModuleCall(call, bindings, 'effect', 'forkIn') ||
              isModuleCall(call, bindings, 'effect', 'fork') ||
              isModuleCall(call, bindings, 'effect', 'forkDaemon')
            ) {
              markHandle(handles, node, 'Fiber');
            }
          }
        }
        if (init?.type === 'CallExpression' && isModuleCall(init, bindings, 'ref', 'makeUnsafe')) {
          markHandle(handles, node, 'Ref');
        }
      });

      walkFunctionBody(fn, (node) => {
        if (node.type !== 'YieldExpression' || node.delegate !== true) {
          return;
        }
        const argument = unwrapExpression(node.argument);
        if (argument?.type !== 'Identifier') {
          return;
        }
        const kind = handles.get(argument.name);
        if (kind === undefined) {
          if (
            argument.name === 'Ref' ||
            argument.name === 'Fiber' ||
            argument.name === 'Deferred'
          ) {
            const replacement =
              argument.name === 'Ref'
                ? 'Ref.get'
                : argument.name === 'Fiber'
                  ? 'Fiber.join'
                  : 'Deferred.await';
            context.report({
              messageId: 'handle',
              node,
              data: { kind: argument.name, replacement },
            });
          }
          return;
        }
        const replacement =
          kind === 'Ref' ? 'Ref.get' : kind === 'Fiber' ? 'Fiber.join' : 'Deferred.await';
        context.report({ messageId: 'handle', node, data: { kind, replacement } });
      });
    }
  },
});
