import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { callHasFunctionArgument, getStaticMemberPath, outerParent } from '../ast.ts';
import { collectEffectBindings, isEffectFnAppliedCall, type EffectBindings } from '../bindings.ts';
import {
  CALLEES_OPTION_SCHEMA,
  DEFAULT_CALLEES_OPTIONS,
  readCalleeList,
  shouldSkipEffectFile,
} from '../options.ts';

export const preferFnUntracedInCallbacksName = bnRuleName('prefer-fn-untraced-in-callbacks');

/** True when the dotted callee name (`Effect.forEach`) or its last part (`forEach`) is in `names`. */
function calleeMatches(
  call: ESTree.CallExpression | ESTree.NewExpression,
  names: readonly string[],
): boolean {
  if (names.length === 0) {
    return false;
  }
  const path = getStaticMemberPath(call.callee);
  if (path === undefined) {
    return false;
  }
  const full = path.join('.');
  const last = path[path.length - 1];
  return names.some((name) => name === full || name === last);
}

export const preferFnUntracedInCallbacks: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Effect.fnUntraced over a traced Effect.fn("name")(…) passed directly as a callback',
    },
    messages: {
      untraced: agentDiagnostic({
        problem:
          'A traced `Effect.fn(…)(…)` is passed as a callback argument. It makes a new span on each call.',
        why: 'Callbacks for `Effect.forEach`, `Stream.mapEffect`, `Effect.catch*`, or a transaction run once for each item or error. Each call adds a span, so traces become large and slow. The parent span already covers the work.',
        fix: 'Replace `Effect.fn("name")(function* (…) { … })` with `Effect.fnUntraced(function* (…) { … })`. If the callback does its own I/O that you must time, bind it to a name first.',
        avoid: 'Do not wrap the callback in another function to hide it. Do not disable the rule.',
      }),
    },
    schema: [CALLEES_OPTION_SCHEMA],
    defaultOptions: DEFAULT_CALLEES_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let callees: readonly string[];

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        callees = readCalleeList(context);
      },
      CallExpression(node) {
        if (!isEffectFnAppliedCall(node, bindings)) {
          return;
        }
        const parent = outerParent(node);
        if (parent?.type !== 'CallExpression' && parent?.type !== 'NewExpression') {
          return;
        }
        if (!callHasFunctionArgument(parent, node) || calleeMatches(parent, callees)) {
          return;
        }
        context.report({ messageId: 'untraced', node });
      },
    };
  },
});
