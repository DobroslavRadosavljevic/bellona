import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
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

export const requireEffectFnNameName = bnRuleName('require-fn-name');

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

export const requireEffectFnName: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Effect.fn to take a span name that matches the function binding',
    },
    messages: {
      missing: agentDiagnostic({
        problem:
          '`Effect.fn` is called without a string span name (`Effect.fn(function* () { … })`).',
        why: 'The name is the trace span and the identifier in logs. Unnamed `fn` cannot be matched to a binding.',
        fix: 'Write `Effect.fn("loadUser")(function* (…) { … })` using the same name as the binding.',
        avoid: 'Do not pass a non-string expression as the name. Do not disable the rule.',
      }),
      mismatch: agentDiagnostic({
        problem:
          '`Effect.fn` span name `"{{spanName}}"` does not match binding `"{{binding}}"` (or `object.{{binding}}`).',
        why: 'Traces then show a different name than the export, so search and logs disagree.',
        fix: 'Set the string to `"{{binding}}"` (or `"{{binding}}"` after the object prefix). Rename either the binding or the span so they match.',
        avoid:
          'Do not pick a “pretty” span that differs from the function. Do not disable the rule.',
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
