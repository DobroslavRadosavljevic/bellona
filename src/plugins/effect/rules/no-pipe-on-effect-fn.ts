import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isEffectFnAppliedCall, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noPipeOnEffectFnName = bnRuleName('effect', 'no-pipe-on-fn');

export const noPipeOnEffectFn: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Do not call .pipe on Effect.fn(...)(...); pass combinators as extra arguments',
    },
    messages: {
      pipe: 'Pass extra combinators as arguments to Effect.fn, not .pipe.',
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
      MemberExpression(node) {
        if (getStaticPropertyName(node.property) !== 'pipe') {
          return;
        }
        const object = unwrapExpression(node.object);
        if (object?.type !== 'CallExpression' || !isEffectFnAppliedCall(object, bindings)) {
          return;
        }
        context.report({ messageId: 'pipe', node });
      },
    };
  },
});
