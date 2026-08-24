import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noDateNowInEffectName = bnRuleName('effect', 'no-date-now');

function isDateConstructor(node: ReturnType<typeof unwrapExpression>): boolean {
  if (node?.type === 'Identifier' && node.name === 'Date') {
    return true;
  }
  if (node?.type === 'MemberExpression' && getStaticPropertyName(node.property) === 'Date') {
    return true;
  }
  return false;
}

export const noDateNowInEffect: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use Clock / DateTime instead of Date.now() and new Date() in Effect modules',
    },
    messages: {
      now: 'Use Clock.currentTimeMillis or DateTime.now instead of Date.now().',
      construct: 'Use DateTime / Clock instead of new Date() for the current time.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        if (getStaticPropertyName(callee.property) !== 'now') {
          return;
        }
        const object = unwrapExpression(callee.object);
        if (!isDateConstructor(object)) {
          return;
        }
        context.report({ messageId: 'now', node });
      },
      NewExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (!isDateConstructor(callee)) {
          return;
        }
        if (node.arguments.length > 0) {
          return;
        }
        context.report({ messageId: 'construct', node });
      },
    };
  },
});
