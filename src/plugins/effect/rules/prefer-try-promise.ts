import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const preferTryPromiseName = bnRuleName('prefer-try-promise');

export const preferTryPromise: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Effect.tryPromise so promise rejection is a typed error, not a defect',
    },
    messages: {
      promise:
        'Use Effect.tryPromise({ try, catch }) so rejection is typed E. Effect.promise maps reject to a defect.',
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
        if (!isModuleCall(node, bindings, 'effect', 'promise')) {
          return;
        }
        context.report({ messageId: 'promise', node });
      },
    };
  },
});
