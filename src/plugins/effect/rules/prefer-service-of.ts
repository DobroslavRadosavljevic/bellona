import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
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

export const preferServiceOfName = bnRuleName('prefer-service-of');

export const preferServiceOf: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Service.of({ ... }) when returning a Context.Service implementation',
    },
    messages: {
      of: agentDiagnostic({
        problem:
          'This `Context.Service` implementation returns a plain object instead of `{{name}}.of({ … })`.',
        why: '`.of` is the v4 constructor that brands the service. A plain object is not a typed Service instance.',
        fix: 'Return `{{name}}.of({ method() { … } })` (or the equivalent members) from `make` / the layer.',
        avoid:
          'Do not `as {{name}}` on a plain object. Do not use `.Default`. Do not disable the rule.',
      }),
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
      let current: ESTree.Node | undefined = node.parent ?? undefined;
      while (current !== undefined) {
        if (
          current.type === 'FunctionExpression' ||
          current.type === 'FunctionDeclaration' ||
          current.type === 'ArrowFunctionExpression'
        ) {
          break;
        }
        current = current.parent ?? undefined;
      }
      if (current === undefined) {
        return;
      }

      // Follow only the factory expression. Never cross another function body.
      while (current.parent !== null) {
        const parent: ESTree.Node = current.parent;
        if (unwrapExpression(parent) === current) {
          current = parent;
          continue;
        }
        if (parent.type !== 'CallExpression') {
          return;
        }
        if (isModuleCall(parent, bindings, 'layer', 'effect')) {
          if (getCallArgument(parent, 1) === unwrapExpression(current)) {
            context.report({ messageId: 'of', node, data: { name } });
          }
          return;
        }
        const callee = unwrapExpression(parent.callee);
        const factoryCall = callee?.type === 'CallExpression' ? callee : parent;
        const isFactory =
          isModuleCall(factoryCall, bindings, 'effect', 'gen') ||
          isModuleCall(factoryCall, bindings, 'effect', 'sync') ||
          isModuleCall(factoryCall, bindings, 'effect', 'fn') ||
          isModuleCall(factoryCall, bindings, 'effect', 'fnUntraced');
        const isFactoryInvocation = current.type === 'CallExpression' && callee === current;
        if (!isFactory && !isFactoryInvocation) {
          return;
        }
        current = parent;
      }
    }
  },
});
