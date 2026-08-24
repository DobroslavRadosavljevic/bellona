import type { CreateOnceRule } from '@oxlint/plugins';

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
      throwStmt: 'Use return yield* Effect.fail(...) or a Schema.TaggedError instead of throw.',
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
