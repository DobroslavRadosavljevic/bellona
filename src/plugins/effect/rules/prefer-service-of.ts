import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { classNameOf, enclosingClass, getCallArgument, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceClassSuper,
  isModuleCall,
  type EffectBindings,
} from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const preferServiceOfName = vmRuleName('prefer-service-of');

export const preferServiceOf: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Service.of({ ... }) when returning a Context.Service implementation',
    },
    messages: {
      of: 'Return {{name}}.of({ ... }) instead of a plain object.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      ReturnStatement(node) {
        reportPlainObject(node, unwrapExpression(node.argument));
      },
      CallExpression(node) {
        if (!isModuleCall(node, bindings, 'layer', 'effect')) {
          return;
        }
        const impl = getCallArgument(node, 1);
        if (impl?.type !== 'CallExpression' || !isModuleCall(impl, bindings, 'effect', 'succeed')) {
          return;
        }
        reportPlainObject(node, getCallArgument(impl, 0));
      },
    };

    function reportPlainObject(node: ESTree.Node, value: ESTree.Node | undefined): void {
      if (value?.type !== 'ObjectExpression') {
        return;
      }
      const cls = enclosingClass(node);
      if (cls === undefined || !isContextServiceClassSuper(cls.superClass ?? undefined, bindings)) {
        return;
      }
      const name = classNameOf(cls);
      if (name === undefined) {
        return;
      }
      if (node.type === 'CallExpression') {
        context.report({ messageId: 'of', node, data: { name } });
        return;
      }
      let current: ESTree.Node | undefined = node;
      while (current !== undefined) {
        if (
          current.type === 'CallExpression' &&
          isModuleCall(current, bindings, 'layer', 'effect')
        ) {
          context.report({ messageId: 'of', node, data: { name } });
          return;
        }
        current = current.parent ?? undefined;
      }
    }
  },
});
