import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { classNameOf, enclosingClass, getStringLiteral, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceClassSuper,
  isEffectFnFactoryCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireFnOwnerPrefixName = bnRuleName('require-fn-owner-prefix');

/**
 * The fixed start of a span name: the whole text of a string literal, or the text before
 * the first `${…}` of a template literal. Undefined for other nodes.
 */
function spanNameHead(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'TemplateLiteral') {
    return expression.quasis[0]?.value.cooked ?? undefined;
  }
  return getStringLiteral(expression);
}

export const requireFnOwnerPrefix: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require Effect.fn span names inside a Context.Service class to start with the class name',
    },
    messages: {
      owner: agentDiagnostic({
        problem:
          'This `Effect.fn` span name `"{{spanName}}"` is inside service `{{owner}}` but does not start with `{{owner}}.`.',
        why: 'The owner prefix shows which service made a span or a log line. A bare name such as `"deliver"` can come from many places.',
        fix: 'Write `Effect.fn("{{owner}}.method")`. For a helper inside a method, write `Effect.fn("{{owner}}.method.helper")`.',
        avoid: 'Do not use a short or different owner name. Do not disable the rule.',
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
        const spanName = spanNameHead(node.arguments[0]);
        if (spanName === undefined) {
          return;
        }
        const cls = enclosingClass(node);
        if (
          cls === undefined ||
          !isContextServiceClassSuper(cls.superClass ?? undefined, bindings)
        ) {
          return;
        }
        const owner = classNameOf(cls);
        if (owner === undefined || spanName.startsWith(`${owner}.`)) {
          return;
        }
        context.report({ messageId: 'owner', node, data: { spanName, owner } });
      },
    };
  },
});
