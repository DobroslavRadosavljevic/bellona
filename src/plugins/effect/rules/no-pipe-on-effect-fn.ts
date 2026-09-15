import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isEffectFnAppliedCall,
  isEffectFnUntracedCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noPipeOnEffectFnName = bnRuleName('no-pipe-on-fn');

export const noPipeOnEffectFn: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Do not call .pipe on Effect.fn(...)(...); pass combinators as extra arguments',
    },
    messages: {
      pipe: agentDiagnostic({
        problem:
          'This pipes the result of `Effect.fn(...)(...)` with `.pipe`. Extra combinators belong on `Effect.fn` itself.',
        why: '`.pipe` after `fn` / `fnUntraced` is a second composition path. Extra combinators belong as extra arguments.',
        fix: 'Pass combinators as extra arguments: `Effect.fn("loadUser")(function* () { … }, Effect.catchTag("Boom", …))` (same extra-arg slot on `fnUntraced`). Remove `.pipe`.',
        avoid: 'Do not assign to a temp and pipe. Do not disable the rule.',
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
      MemberExpression(node) {
        if (getStaticPropertyName(node.property) !== 'pipe') {
          return;
        }
        const object = unwrapExpression(node.object);
        if (object?.type !== 'CallExpression') {
          return;
        }
        if (!isEffectFnAppliedCall(object, bindings) && !isEffectFnUntracedCall(object, bindings)) {
          return;
        }
        context.report({ messageId: 'pipe', node });
      },
    };
  },
});
