import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, outerParent, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isEffectFnAppliedCall,
  isEffectFnUntracedCall,
  isEffectNamespaceCall,
  type EffectBindings,
} from '../bindings.ts';
import {
  effectFnOwnerCall,
  isEffectLogCall,
  isEffectLogMember,
  isTracedFnOwner,
  nearestFunction,
} from '../module-refs.ts';
import { shouldSkipEffectStyleFile } from '../options.ts';

export const noLogAndRethrowName = bnRuleName('no-log-and-rethrow');

/** Arguments after `node` in the call that holds it. */
function laterArguments(call: ESTree.CallExpression, node: ESTree.Node): ESTree.Node[] {
  const index = call.arguments.findIndex((argument) => unwrapExpression(argument) === node);
  return index < 0 ? [] : call.arguments.slice(index + 1);
}

/** Taps that see a failure and then fail again with it. Verified in `effect@4.0.0-rc.115`. */
const ERROR_TAPS = ['tapError', 'tapCause', 'tapErrorTag', 'tapDefect'];

/**
 * A later step with one of these names handles the error, changes it, or tries again. Then
 * the log is the only record of the first failure, so it is useful.
 */
const HANDLING_STEP =
  /^(?:catch|orElse|ignore|option|result|exit|match|mapError|mapBoth|retry|sandbox|flip)/u;

const LOG_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    tracedOnly: { type: 'boolean' },
  },
} as const;

/** The one expression that a handler returns, or undefined when it does more. */
function onlyResult(fn: ESTree.Function | ESTree.ArrowFunctionExpression): ESTree.Node | undefined {
  const body = fn.body;
  if (body === null || body === undefined) {
    return undefined;
  }
  if (body.type !== 'BlockStatement') {
    return body;
  }
  const [statement, ...rest] = body.body;
  if (rest.length > 0) {
    return undefined;
  }
  if (statement?.type === 'ReturnStatement') {
    return statement.argument ?? undefined;
  }
  return statement?.type === 'ExpressionStatement' ? statement.expression : undefined;
}

export const noLogAndRethrow: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Effect.tapError / tapCause handlers that only log inside a traced Effect.fn when the error then fails again',
    },
    messages: {
      logged: agentDiagnostic({
        problem:
          '`{{api}}` only logs the failure. Then the same failure goes on to the caller, and the traced `Effect.fn` records it again.',
        why: 'The span of `Effect.fn("…")` already records each failure. Each caller that logs the error adds one more copy. One failure then shows as many log lines, and the real boundary is hard to find.',
        fix: 'Remove the tap and log one time, at the boundary that handles the error (route, job runner, or `Effect.catch*`). To add context, use `Effect.annotateLogs` or `Effect.annotateCurrentSpan`. To keep the log, handle the error after it: `Effect.catchTag`, `Effect.orElseSucceed`, or `Effect.mapError`.',
        avoid: 'Do not change the log level to hide the copy. Do not disable the rule.',
      }),
    },
    schema: [LOG_OPTION_SCHEMA],
    defaultOptions: [{ allow: [], tracedOnly: true }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let tracedOnly: boolean;

    /** The `Effect` export name of `Effect.x` or `Effect.x(…)`. */
    function effectExportName(node: ESTree.Node | undefined): string | undefined {
      let expression = unwrapExpression(node);
      if (expression?.type === 'CallExpression') {
        expression = unwrapExpression(expression.callee);
      }
      if (expression?.type === 'Identifier') {
        const bind = bindings.named.get(expression.name);
        return bind?.kind === 'effect' ? bind.exportName : undefined;
      }
      if (expression?.type !== 'MemberExpression') {
        return undefined;
      }
      const object = unwrapExpression(expression.object);
      return object?.type === 'Identifier' && bindings.namespaces.effect.has(object.name)
        ? getStaticPropertyName(expression.property)
        : undefined;
    }

    function isHandlingStep(node: ESTree.Node | undefined): boolean {
      const name = effectExportName(node);
      return name !== undefined && HANDLING_STEP.test(name);
    }

    function handlerOnlyLogs(handler: ESTree.Node | undefined): boolean {
      const value = unwrapExpression(handler);
      if (isEffectLogMember(value, bindings)) {
        return true;
      }
      return isFunctionLike(value) && isEffectLogCall(onlyResult(value), bindings);
    }

    function isTracedGenerator(fn: ESTree.Node | undefined): boolean {
      const owner = fn === undefined ? undefined : effectFnOwnerCall(fn, bindings);
      return owner !== undefined && isTracedFnOwner(owner, bindings);
    }

    /**
     * Walk out from an Effect expression through `.pipe(…)` calls and data-first `Effect.*`
     * wrappers. True when a step after it handles the error.
     */
    function handledLater(node: ESTree.Node): boolean {
      let current: ESTree.Node = node;
      while (true) {
        const parent = outerParent(current);
        if (
          parent?.type === 'MemberExpression' &&
          getStaticPropertyName(parent.property) === 'pipe'
        ) {
          const call = outerParent(parent);
          if (call?.type !== 'CallExpression' || unwrapExpression(call.callee) !== parent) {
            return false;
          }
          if (call.arguments.some(isHandlingStep)) {
            return true;
          }
          current = call;
          continue;
        }
        if (
          parent?.type === 'CallExpression' &&
          isEffectNamespaceCall(parent, bindings) &&
          unwrapExpression(parent.arguments[0]) === current
        ) {
          if (isHandlingStep(parent)) {
            return true;
          }
          current = parent;
          continue;
        }
        return false;
      }
    }

    function report(node: ESTree.CallExpression, api: string): void {
      context.report({ messageId: 'logged', node, data: { api } });
    }

    function check(node: ESTree.CallExpression, name: string): void {
      const api = `Effect.${name}`;
      const parent = outerParent(node);
      if (parent?.type === 'CallExpression' && unwrapExpression(parent.callee) !== node) {
        const callee = unwrapExpression(parent.callee);
        const handled = laterArguments(parent, node).some(isHandlingStep);
        // `Effect.fn("name")(function* () { … }, Effect.tapError(log))`
        if (isEffectFnAppliedCall(parent, bindings)) {
          if (!handled) {
            report(node, api);
          }
          return;
        }
        // `Effect.fnUntraced(function* () { … }, Effect.tapError(log))`
        if (isEffectFnUntracedCall(parent, bindings)) {
          if (!handled && !tracedOnly) {
            report(node, api);
          }
          return;
        }
        // `effect.pipe(…, Effect.tapError(log), …)`
        if (
          callee?.type === 'MemberExpression' &&
          getStaticPropertyName(callee.property) === 'pipe'
        ) {
          if (handled || handledLater(parent)) {
            return;
          }
          if (!tracedOnly || isTracedGenerator(nearestFunction(parent))) {
            report(node, api);
          }
          return;
        }
      }
      // Data-first: `Effect.tapError(effect, log)` or `Effect.tapErrorTag(effect, tag, log)`.
      const dataFirstLength = name === 'tapErrorTag' ? 3 : 2;
      if (node.arguments.length !== dataFirstLength || handledLater(node)) {
        return;
      }
      if (!tracedOnly || isTracedGenerator(nearestFunction(node))) {
        report(node, api);
      }
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        tracedOnly = booleanField(objectOptionAt(context, 0), 'tracedOnly', true);
      },
      CallExpression(node) {
        const name = effectExportName(node.callee);
        if (name === undefined || !ERROR_TAPS.includes(name)) {
          return;
        }
        const handler = node.arguments[node.arguments.length - 1];
        if (handler === undefined || !handlerOnlyLogs(handler)) {
          return;
        }
        check(node, name);
      },
    };
  },
});
