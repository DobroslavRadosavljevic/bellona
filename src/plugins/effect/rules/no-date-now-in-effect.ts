import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noDateNowInEffectName = bnRuleName('no-date-now');

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
      now: agentDiagnostic({
        problem:
          'This Effect code uses `Date.now()` for “current time”. Effect v4 time belongs on `Clock` / `DateTime`.',
        why: '`Date.now()` is not injectable. Tests cannot use `TestClock`, and the value is not an Effect.',
        fix: 'Use `Clock.currentTimeMillis` or `DateTime.now` (yield* inside `Effect.fn` / `Effect.gen`). Pass time as a dependency, not a global.',
        avoid: 'Do not wrap `Date.now()` in `Effect.sync`. Do not disable the rule.',
      }),
      construct: agentDiagnostic({
        problem: 'This Effect code uses `new Date()` for the current time.',
        why: '`new Date()` reads the system clock and skips `Clock` / `DateTime`, so tests cannot control time.',
        fix: 'Use `DateTime.now` or `Clock.currentTimeMillis` and convert with `DateTime` helpers. For a timestamp you already have, parse it — do not call `new Date()` for “now”.',
        avoid: 'Do not use `new Date(Date.now())`. Do not disable the rule.',
      }),
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
