import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

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

const OWNER_PREFIX = /^[\w$]+(\.[\w$]+)*\.$/;

/**
 * Fixed text around the `${…}` parts of a template literal name. For
 * `` `Tools.${name}.reserve` `` the head is `Tools.` and the tail is `.reserve`.
 * Undefined when the node is not a template literal with at least one `${…}`.
 */
function templateParts(
  node: ESTree.Node | undefined,
): { readonly head: string; readonly tail: string } | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'TemplateLiteral' || expression.expressions.length === 0) {
    return undefined;
  }
  const quasis = expression.quasis;
  return {
    head: quasis[0]?.value.cooked ?? '',
    tail: quasis[quasis.length - 1]?.value.cooked ?? '',
  };
}

/**
 * A factory that makes many functions can name each one with a template literal. The name
 * must start with a fixed owner (`Tools.`). A bound function must end with `.<binding>`.
 */
function templateNameIsValid(
  parts: { readonly head: string; readonly tail: string },
  binding: string | undefined,
): boolean {
  if (!OWNER_PREFIX.test(parts.head)) {
    return false;
  }
  return binding === undefined || parts.tail.endsWith(`.${binding}`);
}

/** The text of a string literal or a template literal without `${…}`. */
function staticName(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis[0]?.value.cooked ?? undefined;
  }
  return getStringLiteral(node);
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
          '`Effect.fn` has no string literal span name (`Effect.fn(function* () { … })` or `Effect.fn(name)`).',
        why: 'The name is the trace span and the identifier in logs. `Effect.fn` without a name makes no span at all. Without a literal, the span cannot be matched to a binding.',
        fix: 'Write `Effect.fn("loadUser")(function* (…) { … })` using the same name as the binding. A factory that makes many functions can use a template literal with a fixed owner prefix: ``Effect.fn(`Tools.${name}`)``. If you do not need a span, use `Effect.fnUntraced`.',
        avoid: 'Do not pass a variable as the name. Do not disable the rule.',
      }),
      dynamic: agentDiagnostic({
        problem:
          '`Effect.fn` template span name does not start with a fixed owner (`Owner.`) or does not end with `.{{binding}}`.',
        why: 'A template name is for a factory that makes many functions. Fixed owner text keeps logs searchable. A bound function must still end with its binding name.',
        fix: 'Write ``Effect.fn(`Tools.${name}`)`` in a factory, or ``Effect.fn(`Tools.${name}.{{binding}}`)`` for a bound member. Use a string literal when the name is fixed.',
        avoid: 'Do not start the name with `${…}`. Do not disable the rule.',
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
        const binding = appliedCallBindingName(node);
        const parts = templateParts(node.arguments[0]);
        if (parts !== undefined) {
          if (!templateNameIsValid(parts, binding)) {
            context.report({ messageId: 'dynamic', node, data: { binding: binding ?? 'name' } });
          }
          return;
        }
        const spanName = staticName(node.arguments[0]);
        if (spanName === undefined) {
          context.report({ messageId: 'missing', node });
          return;
        }
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
