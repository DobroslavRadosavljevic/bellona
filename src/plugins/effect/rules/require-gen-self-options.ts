import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, isGeneratorFunction } from '../ast.ts';
import { collectEffectBindings, isEffectGenCall, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireGenSelfOptionsName = bnRuleName('require-gen-self-options');

export const requireGenSelfOptions: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Pass `{ self: this }` as the first argument to Effect.gen when binding a class method',
    },
    messages: {
      selfThis: agentDiagnostic({
        problem:
          '`Effect.gen(this, function* () { … })` is the Effect v3 form. v4 wraps `this` in an options object.',
        why: 'A bare `this` first argument is not the v4 `Effect.gen` signature (`effect@4.0.0-rc`). Types and `this` inside the generator fail.',
        fix: 'Write `Effect.gen({ self: this }, function* () { … })`.',
        avoid: 'Do not keep `Effect.gen(this, …)`. Do not disable the rule.',
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
      CallExpression(node) {
        if (!isEffectGenCall(node, bindings)) {
          return;
        }
        const first = getCallArgument(node, 0);
        const second = getCallArgument(node, 1);
        if (first?.type !== 'ThisExpression') {
          return;
        }
        if (!isGeneratorFunction(second)) {
          return;
        }
        context.report({ messageId: 'selfThis', node: first });
      },
    };
  },
});
