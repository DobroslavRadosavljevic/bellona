import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { enclosingFunction } from '../ast.ts';
import {
  collectEffectBindings,
  generatorFromEffectGenOrFn,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noTryCatchInEffectGenName = bnRuleName('no-try-catch-in-gen');

export const noTryCatchInEffectGen: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow try/catch and try/finally inside Effect.gen and Effect.fn generators',
    },
    messages: {
      tryCatch: agentDiagnostic({
        problem:
          'This `Effect.gen` / `Effect.fn` generator uses `try/catch`. JS catch is not the Effect error channel.',
        why: 'A failed `yield*` does not throw into the generator. Effect stops the generator, so `catch` never gets `Effect.fail` errors. It gets only plain JS throws.',
        fix: 'Remove `try/catch`. Use `Effect.catch` / `Effect.catchTag` / `Effect.catchCause` on the Effect (or as extra arguments to `Effect.fn`). Wrap throwing sync code in `Effect.try({ try, catch })`.',
        avoid: 'Do not `throw` inside the generator. Do not disable the rule.',
      }),
      tryFinally: agentDiagnostic({
        problem:
          'This `Effect.gen` / `Effect.fn` generator uses `try/finally`. The `finally` block is not an Effect finalizer.',
        why: 'When a `yield*` fails or the fiber is interrupted, Effect stops the generator and does not call `return` on it. The `finally` block does not run.',
        fix: 'Remove `try/finally`. Use `Effect.ensuring`, `Effect.onExit`, `Effect.acquireRelease`, or `Effect.addFinalizer`.',
        avoid: 'Do not move the cleanup after the last `yield*`. Do not disable the rule.',
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
      TryStatement(node) {
        const fn = enclosingFunction(node);
        if (fn === undefined || generatorFromEffectGenOrFn(fn, bindings) !== fn) {
          return;
        }
        context.report({
          messageId:
            node.handler === null || node.handler === undefined ? 'tryFinally' : 'tryCatch',
          node,
        });
      },
    };
  },
});
