import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getCallArgument,
  getStaticMemberPath,
  getStaticPropertyName,
  isFunctionLike,
  unwrapExpression,
  walkFunctionBody,
} from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import {
  DEFAULT_SIGNAL_APIS_OPTIONS,
  readSignalApiList,
  shouldSkipEffectFile,
  SIGNAL_APIS_OPTION_SCHEMA,
} from '../options.ts';

export const requirePromiseAbortSignalName = bnRuleName('require-promise-abort-signal');

/** The Promise function of `Effect.tryPromise(fn)`, `Effect.tryPromise({ try: fn })`, or `Effect.promise(fn)`. */
function promiseFunction(node: ESTree.CallExpression): ESTree.Node | undefined {
  const first = getCallArgument(node, 0);
  if (isFunctionLike(first)) {
    return first;
  }
  if (first?.type !== 'ObjectExpression') {
    return undefined;
  }
  for (const property of first.properties) {
    if (property.type === 'Property' && getStaticPropertyName(property.key) === 'try') {
      const value = unwrapExpression(property.value);
      return isFunctionLike(value) ? value : undefined;
    }
  }
  return undefined;
}

/** The first call in the function body to an API that takes an `AbortSignal`. */
function findSignalApiCall(fn: ESTree.Node, apis: readonly string[]): string | undefined {
  let found: string | undefined;
  walkFunctionBody(fn, (node) => {
    if (found !== undefined || node.type !== 'CallExpression') {
      return;
    }
    const path = getStaticMemberPath(node.callee);
    if (path === undefined) {
      return;
    }
    const full = path.join('.');
    const last = path[path.length - 1];
    const api = apis.find((name) => name === full || (path[0] === 'globalThis' && name === last));
    if (api !== undefined) {
      found = api;
    }
  });
  return found;
}

export const requirePromiseAbortSignal: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Effect.tryPromise / Effect.promise to pass the AbortSignal to fetch and similar APIs',
    },
    messages: {
      signal: agentDiagnostic({
        problem:
          'This Promise function calls `{{api}}` but takes no `signal` parameter. Interrupting the Effect does not stop the request.',
        why: 'Effect gives the Promise function an `AbortSignal`. It aborts the signal when the fiber is interrupted, for example on a timeout or a closed client. Without it, the request keeps running.',
        fix: 'Write `try: (signal) => {{api}}(url, { signal })` (or `Effect.promise((signal) => …)`). To add a timeout, pass `AbortSignal.any([signal, AbortSignal.timeout(ms)])`.',
        avoid:
          'Do not make a new `AbortController` that Effect cannot abort. Do not disable the rule.',
      }),
    },
    schema: [SIGNAL_APIS_OPTION_SCHEMA],
    defaultOptions: DEFAULT_SIGNAL_APIS_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let apis: readonly string[];

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        apis = readSignalApiList(context);
      },
      CallExpression(node) {
        if (
          !isModuleCall(node, bindings, 'effect', 'tryPromise') &&
          !isModuleCall(node, bindings, 'effect', 'promise')
        ) {
          return;
        }
        const fn = promiseFunction(node);
        if (!isFunctionLike(fn) || fn.params.length > 0) {
          return;
        }
        const api = findSignalApiCall(fn, apis);
        if (api === undefined) {
          return;
        }
        context.report({ messageId: 'signal', node: fn, data: { api } });
      },
    };
  },
});
