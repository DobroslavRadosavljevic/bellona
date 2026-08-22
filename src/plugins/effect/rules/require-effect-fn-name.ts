import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import {
  getBindingNameForInitializer,
  getStringLiteral,
  parentOf,
  unwrapExpression,
} from '../ast.ts';
import {
  collectEffectBindings,
  isEffectFnAppliedCall,
  isEffectFnFactoryCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireEffectFnNameName = vmRuleName('require-effect-fn-name');

function appliedCallBindingName(factoryCall: Parameters<typeof parentOf>[0]): string | undefined {
  const parent = parentOf(factoryCall);
  if (parent?.type !== 'CallExpression') {
    return getBindingNameForInitializer(factoryCall);
  }
  if (unwrapExpression(parent.callee) !== factoryCall) {
    return getBindingNameForInitializer(factoryCall);
  }
  return getBindingNameForInitializer(parent);
}

function namesMatch(spanName: string, binding: string): boolean {
  return spanName === binding || spanName.endsWith(`.${binding}`);
}

export const requireEffectFnName: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Effect.fn to take a span name that matches the function binding',
    },
    messages: {
      missing: 'Pass a string name to Effect.fn("name").',
      mismatch: 'Effect.fn name "{{spanName}}" should match binding "{{binding}}".',
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
        if (!isEffectFnFactoryCall(node, bindings)) {
          return;
        }
        if (isEffectFnAppliedCall(node, bindings)) {
          return;
        }
        const spanName = getStringLiteral(node.arguments[0]);
        if (spanName === undefined) {
          context.report({ messageId: 'missing', node });
          return;
        }
        const binding = appliedCallBindingName(node);
        if (binding === undefined) {
          return;
        }
        if (!namesMatch(spanName, binding)) {
          context.report({
            messageId: 'mismatch',
            node,
            data: { spanName, binding },
          });
        }
      },
    };
  },
});
