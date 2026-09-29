import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isEffectExpression,
  isInEffectGenerator,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noReturnEffectInGenName = bnRuleName('no-return-effect-in-gen');

export const noReturnEffectInGen: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow returning an Effect without yield* from Effect.gen and Effect.fn generators',
    },
    messages: {
      returnEffect: agentDiagnostic({
        problem:
          'This generator returns an Effect without `yield*`. The Effect becomes the success value. It does not run.',
        why: 'The generator result is the success value. `return Effect.fail(e)` succeeds with an Effect inside. It does not fail, and the error type does not show `e`.',
        fix: 'Write `return yield* Effect.fail(e)`. For `Effect.succeed(value)`, return `value`.',
        avoid: 'Do not add `Effect.flatten` at the call site to hide it. Do not disable the rule.',
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
      ReturnStatement(node) {
        const argument = unwrapExpression(node.argument);
        if (!isEffectExpression(argument, bindings)) {
          return;
        }
        if (!isInEffectGenerator(node, bindings)) {
          return;
        }
        context.report({ messageId: 'returnEffect', node });
      },
    };
  },
});
