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
      description: 'Disallow try/catch inside Effect.gen and Effect.fn generators',
    },
    messages: {
      tryCatch: agentDiagnostic({
        problem:
          'This `Effect.gen` / `Effect.fn` generator uses `try/catch`. JS catch is not the Effect error channel.',
        why: '`catch` hides typed `E` and turns failures into control-flow. `catchTag` / `catch` combinators stay in the Effect.',
        fix: 'Remove `try/catch`. Use `yield*` and `Effect.catch` / `Effect.catchTag` / `Effect.catchCause` on the Effect (or extra arguments to `Effect.fn`).',
        avoid: 'Do not `throw` inside the generator. Do not disable the rule.',
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
        context.report({ messageId: 'tryCatch', node });
      },
    };
  },
});
