import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getCallArgument,
  getStaticPropertyName,
  parentOf,
  pipeRoot,
  unwrapExpression,
} from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type BindingKind,
  type EffectBindings,
} from '../bindings.ts';
import { shouldSkipEffectStyleFile } from '../options.ts';

export const requireIgnoreLogName = bnRuleName('require-ignore-log');

const IGNORE_APIS = ['ignore', 'ignoreCause'] as const;

/** Calls whose argument at `index` (`-1` = last) runs as cleanup. */
const FINALIZERS: readonly { kind: BindingKind; name: string; index: number }[] = [
  { kind: 'effect', name: 'addFinalizer', index: -1 },
  { kind: 'effect', name: 'ensuring', index: -1 },
  { kind: 'effect', name: 'onExit', index: -1 },
  { kind: 'effect', name: 'onInterrupt', index: -1 },
  { kind: 'effect', name: 'onError', index: -1 },
  { kind: 'effect', name: 'acquireRelease', index: 1 },
  { kind: 'effect', name: 'acquireUseRelease', index: 2 },
  { kind: 'scope', name: 'addFinalizer', index: -1 },
  { kind: 'scope', name: 'addFinalizerExit', index: -1 },
];

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
    allowInFinalizers: { type: 'boolean' },
  },
} as const;

function isScopeClose(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const root = pipeRoot(node);
  return root?.type === 'CallExpression' && isModuleCall(root, bindings, 'scope', 'close');
}

/** True when `node` sits in a cleanup argument, or ignores a `Scope.close(…)` result. */
function isInFinalizer(node: ESTree.Node, bindings: EffectBindings): boolean {
  let child = node;
  let parent = parentOf(node);
  while (parent !== undefined) {
    if (parent.type === 'CallExpression' && parent.callee !== child) {
      const call = parent;
      const current = child;
      const index = call.arguments.findIndex((argument) => argument === current);
      const cleanup = FINALIZERS.some(
        (finalizer) =>
          isModuleCall(call, bindings, finalizer.kind, finalizer.name) &&
          index === (finalizer.index < 0 ? call.arguments.length - 1 : finalizer.index),
      );
      if (cleanup) {
        return true;
      }
      const callee = unwrapExpression(call.callee);
      if (
        callee?.type === 'MemberExpression' &&
        getStaticPropertyName(callee.property) === 'pipe' &&
        isScopeClose(callee.object, bindings)
      ) {
        return true;
      }
    }
    child = parent;
    parent = parentOf(parent);
  }
  return false;
}

/** Effect calls that log or observe the failure before `ignore` drops it. */
const OBSERVERS = ['tapError', 'tapCause', 'tapErrorTag', 'tapDefect'] as const;

function isObserver(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const expression = unwrapExpression(node);
  return (
    expression?.type === 'CallExpression' &&
    OBSERVERS.some((name) => isModuleCall(expression, bindings, 'effect', name))
  );
}

/**
 * True when an earlier `.pipe` step, or the data-first argument, already taps the failure:
 * `task.pipe(Effect.tapError(log), Effect.ignore)`.
 */
function isObservedBefore(
  node: ESTree.Node,
  call: ESTree.CallExpression | undefined,
  bindings: EffectBindings,
): boolean {
  const target = call ?? node;
  const parent = parentOf(target);
  if (parent?.type === 'CallExpression' && parent.callee !== target) {
    const callee = unwrapExpression(parent.callee);
    if (callee?.type === 'MemberExpression' && getStaticPropertyName(callee.property) === 'pipe') {
      const index = parent.arguments.findIndex((argument) => argument === target);
      if (parent.arguments.slice(0, index).some((argument) => isObserver(argument, bindings))) {
        return true;
      }
    }
  }
  const effect = call === undefined ? undefined : unwrapExpression(call.arguments[0]);
  if (effect?.type !== 'CallExpression') {
    return false;
  }
  const effectCallee = unwrapExpression(effect.callee);
  return (
    effectCallee?.type === 'MemberExpression' &&
    getStaticPropertyName(effectCallee.property) === 'pipe' &&
    effect.arguments.some((argument) => isObserver(argument, bindings))
  );
}

/** True when the options set `log` to anything but `false`, or are not a literal object. */
function hasLogOption(node: ESTree.Node | undefined): boolean {
  const options = unwrapExpression(node);
  if (options === undefined) {
    return false;
  }
  if (options.type !== 'ObjectExpression') {
    return true;
  }
  return options.properties.some((property) => {
    if (property.type !== 'Property') {
      return true;
    }
    if (getStaticPropertyName(property.key) !== 'log') {
      return false;
    }
    const value = unwrapExpression(property.value);
    return !(value?.type === 'Literal' && value.value === false);
  });
}

export const requireIgnoreLog: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Effect.ignore / Effect.ignoreCause to log what they drop',
    },
    messages: {
      log: agentDiagnostic({
        problem: '`Effect.{{api}}` drops the failure without a log.',
        why: '`Effect.{{api}}` turns a failure into success. Without `log`, nobody can see that the work failed. `ignoreCause` also drops defects (bugs).',
        fix: 'Write `Effect.{{api}}({ log: "Warn", message: "… failed" })`. `log` takes `true` or a level: `"Debug"`, `"Info"`, `"Warn"`, `"Error"`.',
        avoid: 'Do not pass `log: false`. Do not disable the rule.',
      }),
    },
    schema: [OPTION_SCHEMA],
    defaultOptions: [{ allow: [], allowInFinalizers: true }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let allowInFinalizers: boolean;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        allowInFinalizers = booleanField(objectOptionAt(context, 0), 'allowInFinalizers', true);
      },
      MemberExpression(node) {
        check(node);
      },
      Identifier(node) {
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node)
        ) {
          return;
        }
        check(node);
      },
    };

    function check(node: ESTree.Node): void {
      const api = IGNORE_APIS.find((name) => isModuleMember(node, bindings, 'effect', name));
      if (api === undefined) {
        return;
      }
      const parent = parentOf(node);
      const call =
        parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node
          ? parent
          : undefined;
      if (isObservedBefore(node, call, bindings)) {
        return;
      }
      if (parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node) {
        const first = getCallArgument(parent, 0);
        const options = first?.type === 'ObjectExpression' ? first : getCallArgument(parent, 1);
        if (hasLogOption(options)) {
          return;
        }
        if (
          first !== undefined &&
          first.type !== 'ObjectExpression' &&
          isScopeClose(first, bindings)
        ) {
          return;
        }
      }
      if (allowInFinalizers && isInFinalizer(node, bindings)) {
        return;
      }
      context.report({ messageId: 'log', node, data: { api } });
    }
  },
});
