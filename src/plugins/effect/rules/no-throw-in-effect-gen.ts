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

export const noThrowInEffectGenName = bnRuleName('no-throw-in-gen');

export const noThrowInEffectGen: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow throw inside Effect.gen and Effect.fn generators',
    },
    messages: {
      throwStmt: agentDiagnostic({
        problem:
          'This `Effect.gen` / `Effect.fn` generator uses `throw`. Failures belong in the Effect error channel.',
        why: '`throw` becomes a defect, not typed `E`. Callers cannot `catchTag`.',
        fix: 'Write `return yield* Effect.fail(...)` or `return yield* new Schema.TaggedError(...)`. Use `return yield*` so TypeScript narrows the rest of the generator.',
        avoid: 'Do not wrap `throw` in `try/catch` (also banned). Do not disable the rule.',
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
      ThrowStatement(node) {
        const fn = enclosingFunction(node);
        if (fn === undefined || generatorFromEffectGenOrFn(fn, bindings) !== fn) {
          return;
        }
        context.report({ messageId: 'throwStmt', node });
      },
    };
  },
});
