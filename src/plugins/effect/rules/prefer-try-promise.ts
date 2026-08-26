import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
      promise: agentDiagnostic({
        problem:
          'This uses `Effect.promise`. Rejections become defects (`Cause.Die`), not typed `E`.',
        why: 'A Promise that can reject is an error channel. `Effect.promise` hides that as a defect.',
        fix: 'Use `Effect.tryPromise({ try: () => fetch(…), catch: (cause) => new Boom({ message: String(cause) }) })` so reject is typed `E`.',
        avoid:
          'Do not add `.catch` on the Promise inside `Effect.promise`. Do not disable the rule.',
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
      CallExpression(node) {
        if (!isModuleCall(node, bindings, 'effect', 'promise')) {
          return;
        }
        context.report({ messageId: 'promise', node });
      },
    };
  },
});
