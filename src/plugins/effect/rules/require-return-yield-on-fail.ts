import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { enclosingFunction, isReturnedNode, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  generatorFromEffectGenOrFn,
  isEffectFailLikeCall,
  isTaggedErrorConstruct,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireReturnYieldOnFailName = vmRuleName('require-return-yield-on-fail');

export const requireReturnYieldOnFail: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require return yield* when failing inside Effect.gen so TypeScript can narrow',
    },
    messages: {
      returnYield:
        'Use return yield* when failing so TypeScript can narrow the rest of the generator.',
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
      YieldExpression(node) {
        if (node.delegate !== true) {
          return;
        }
        const fn = enclosingFunction(node);
        if (fn === undefined || generatorFromEffectGenOrFn(fn, bindings) !== fn) {
          return;
        }
        if (isReturnedNode(node)) {
          return;
        }
        const argument = unwrapExpression(node.argument);
        if (
          !isEffectFailLikeCall(argument, bindings) &&
          !isTaggedErrorConstruct(argument, bindings)
        ) {
          return;
        }
        context.report({ messageId: 'returnYield', node });
      },
    };
  },
});
