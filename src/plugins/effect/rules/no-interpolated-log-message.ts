import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { EFFECT_LOG_EXPORTS } from '../module-refs.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noInterpolatedLogMessageName = bnRuleName('no-interpolated-log-message');

/** The parts of a `+` chain: `a + "b" + c` gives `a`, `"b"`, `c`. */
function concatParts(node: ESTree.Node | undefined): ESTree.Node[] {
  const expression = unwrapExpression(node);
  if (expression?.type === 'BinaryExpression' && expression.operator === '+') {
    return [...concatParts(expression.left), ...concatParts(expression.right)];
  }
  return expression === undefined ? [] : [expression];
}

function isStaticText(node: ESTree.Node): boolean {
  return (
    (node.type === 'Literal' && isJsString(node.value)) ||
    (node.type === 'TemplateLiteral' && node.expressions.length === 0)
  );
}

/**
 * True for a template with `${…}`, or a `+` chain that joins text with a value.
 * A `+` chain of fixed text only (`"a" + "b"`) is a fixed message.
 */
function isBuiltMessage(node: ESTree.Node | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type === 'TemplateLiteral') {
    return expression.expressions.length > 0;
  }
  if (expression?.type !== 'BinaryExpression') {
    return false;
  }
  const parts = concatParts(expression);
  const hasText = parts.some((part) => isStaticText(part) || part.type === 'TemplateLiteral');
  return hasText && parts.some((part) => !isStaticText(part));
}

export const noInterpolatedLogMessage: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow an Effect.log* message that is built from values with a template literal or +',
    },
    messages: {
      interpolated: agentDiagnostic({
        problem:
          '`{{api}}` gets a message that is built from values. Each value makes a new message text.',
        why: 'Log tools group and search by the message text. A message with values in it makes a new group for each value, and the values are not separate fields, so you cannot filter on them.',
        fix: 'Write a fixed message and give the values as data: `{{api}}("Billing job failed", { job: name }, cause)`. For values that many logs share, use `Effect.annotateLogs({ job: name })` on the Effect.',
        avoid:
          'Do not join the values into the message with `+` or `String(…)`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    function logApi(node: ESTree.CallExpression): string | undefined {
      const name = EFFECT_LOG_EXPORTS.find((entry) =>
        isModuleCall(node, bindings, 'effect', entry),
      );
      if (name !== undefined) {
        return `Effect.${name}`;
      }
      const callee = unwrapExpression(node.callee);
      return callee?.type === 'CallExpression' &&
        isModuleCall(callee, bindings, 'effect', 'logWithLevel')
        ? 'Effect.logWithLevel'
        : undefined;
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        const api = logApi(node);
        if (api === undefined || !isBuiltMessage(getCallArgument(node, 0))) {
          return;
        }
        context.report({
          messageId: 'interpolated',
          node: node.arguments[0] ?? node,
          data: { api },
        });
      },
    };
  },
});
