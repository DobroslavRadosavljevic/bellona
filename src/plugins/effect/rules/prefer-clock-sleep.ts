import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { enclosingFunction, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  generatorFromEffectGenOrFn,
  type EffectBindings,
} from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

const TIMERS = new Set(['setTimeout', 'setInterval', 'setImmediate']);

function isTimerCallee(node: ReturnType<typeof unwrapExpression>): boolean {
  if (node?.type === 'Identifier') {
    return TIMERS.has(node.name);
  }
  if (node?.type !== 'MemberExpression') {
    return false;
  }
  const property = getStaticPropertyName(node.property);
  if (property === undefined || !TIMERS.has(property)) {
    return false;
  }
  const object = unwrapExpression(node.object);
  if (object?.type !== 'Identifier') {
    return false;
  }
  return object.name === 'globalThis' || object.name === 'window' || object.name === 'global';
}

export const preferClockSleepName = bnRuleName('effect', 'prefer-clock-sleep');

export const preferClockSleep: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Effect.sleep over setTimeout / setInterval inside Effect generators',
    },
    messages: {
      sleep: 'Use Effect.sleep so TestClock can control time.',
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
      CallExpression(node) {
        const fn = enclosingFunction(node);
        if (fn === undefined || generatorFromEffectGenOrFn(fn, bindings) !== fn) {
          return;
        }
        if (!isTimerCallee(unwrapExpression(node.callee))) {
          return;
        }
        context.report({ messageId: 'sleep', node });
      },
    };
  },
});
