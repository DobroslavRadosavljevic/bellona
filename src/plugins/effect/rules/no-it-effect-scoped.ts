import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, pipeRoot, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  isScopedLiveCall,
  isVitestEffectRunnerCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noItEffectScopedName = bnRuleName('no-it-scoped');

function isEffectScopedCall(
  node: ReturnType<typeof unwrapExpression>,
  bindings: EffectBindings,
): boolean {
  return node?.type === 'CallExpression' && isModuleCall(node, bindings, 'effect', 'scoped');
}

function argumentLooksScoped(
  argument: ESTree.CallExpression['arguments'][number],
  bindings: EffectBindings,
): boolean {
  if (argument.type === 'SpreadElement') {
    return false;
  }
  const expression = unwrapExpression(argument);
  return (
    isModuleMember(expression, bindings, 'effect', 'scoped') ||
    isEffectScopedCall(expression, bindings)
  );
}

function wrapsEffectScoped(
  node: ReturnType<typeof unwrapExpression>,
  bindings: EffectBindings,
): boolean {
  if (isEffectScopedCall(pipeRoot(node), bindings)) {
    return true;
  }
  let current = node;
  while (current?.type === 'CallExpression') {
    const callee = unwrapExpression(current.callee);
    if (callee?.type === 'Identifier' && callee.name === 'pipe') {
      return current.arguments.some((argument) => argumentLooksScoped(argument, bindings));
    }
    if (callee?.type !== 'MemberExpression' || getStaticPropertyName(callee.property) !== 'pipe') {
      break;
    }
    if (current.arguments.some((argument) => argumentLooksScoped(argument, bindings))) {
      return true;
    }
    current = unwrapExpression(callee.object);
  }
  return false;
}

export const noItEffectScoped: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Do not wrap it.effect / it.live tests in Effect.scoped; those runners already scope',
    },
    messages: {
      scoped:
        'it.effect and it.live already provide a Scope. Do not wrap the test in Effect.scoped.',
      scopedLive: 'it.scopedLive is removed. Use it.live.',
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
        if (isScopedLiveCall(node, bindings)) {
          context.report({ messageId: 'scopedLive', node });
          return;
        }
        if (!isVitestEffectRunnerCall(node, bindings)) {
          return;
        }
        for (const argument of node.arguments) {
          if (argument.type === 'SpreadElement') {
            continue;
          }
          const expression = unwrapExpression(argument);
          if (wrapsEffectScoped(expression, bindings)) {
            context.report({ messageId: 'scoped', node: argument });
            continue;
          }
          if (expression?.type === 'ArrowFunctionExpression' && expression.expression === true) {
            if (wrapsEffectScoped(expression.body, bindings)) {
              context.report({ messageId: 'scoped', node: expression.body });
            }
          }
          if (
            expression?.type === 'ArrowFunctionExpression' ||
            expression?.type === 'FunctionExpression'
          ) {
            const body = expression.body;
            if (body !== null && body !== undefined && body.type === 'BlockStatement') {
              for (const statement of body.body) {
                if (statement.type !== 'ReturnStatement') {
                  continue;
                }
                const returned = statement.argument ?? undefined;
                if (returned === undefined) {
                  continue;
                }
                if (wrapsEffectScoped(returned, bindings)) {
                  context.report({ messageId: 'scoped', node: statement });
                }
              }
            }
          }
        }
      },
    };
  },
});
