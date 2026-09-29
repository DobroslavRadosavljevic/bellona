import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  enclosingFunction,
  getStaticPropertyName,
  isReturnedNode,
  outerParent,
  parentOf,
  unwrapExpression,
} from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  type BindingKind,
  type EffectBindings,
} from '../bindings.ts';
import { collectModuleNames, isModuleNameMember, type ModuleNames } from '../module-names.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noNewErrorInEffectName = bnRuleName('no-new-error-in-effect');

/** Calls whose function argument returns the failure value. */
const ERROR_MAPPERS: readonly { kind: BindingKind; name: string }[] = [
  { kind: 'effect', name: 'failSync' },
  { kind: 'effect', name: 'mapError' },
  { kind: 'effect', name: 'mapBoth' },
  { kind: 'effect', name: 'filterOrFail' },
  { kind: 'stream', name: 'mapError' },
];

/** The call that `node` is a direct argument of. */
function argumentOf(node: ESTree.Node): ESTree.CallExpression | undefined {
  const parent = outerParent(node);
  if (parent?.type !== 'CallExpression' || unwrapExpression(parent.callee) === node) {
    return undefined;
  }
  return parent;
}

export const noNewErrorInEffect: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a plain Error as a typed Effect failure; use a Schema.TaggedError class',
    },
    messages: {
      error: agentDiagnostic({
        problem:
          'This plain `Error` becomes a typed Effect failure (an `Effect.fail` argument, or a `catch` / `mapError` result). Use a tagged error class.',
        why: 'A plain `Error` has no `_tag`, so `Effect.catchTag` cannot match it and the error type shows only `Error`. Callers cannot tell one failure from another.',
        fix: 'Define `class NotFound extends Schema.TaggedError<NotFound>()("NotFound", { … }) {}` and `return yield* new NotFound({ … })`. For a real bug, write `Effect.die(new Error("…"))`.',
        avoid: 'Do not add a `_tag` to a plain `Error` by hand. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let cause: ModuleNames;
    let exit: ModuleNames;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        cause = collectModuleNames(context.sourceCode.ast, 'Cause');
        exit = collectModuleNames(context.sourceCode.ast, 'Exit');
      },
      NewExpression(node) {
        check(node);
      },
      CallExpression(node) {
        check(node);
      },
    };

    /** True when `parent` calls one of `names` on the Effect / Deferred module, or `Cause` / `Exit`. */
    function callsAny(
      parent: ESTree.CallExpression,
      effectNames: readonly string[],
      helperName: string,
    ): boolean {
      return (
        effectNames.some((name) => isModuleCall(parent, bindings, 'effect', name)) ||
        isModuleCall(parent, bindings, 'deferred', helperName) ||
        isModuleNameMember(parent.callee, cause, 'Cause', helperName) ||
        isModuleNameMember(parent.callee, exit, 'Exit', helperName)
      );
    }

    /**
     * True when the plain `Error` becomes a typed failure: an `Effect.fail` argument, or the
     * result of a `catch` / `mapError` / `failSync` function.
     */
    function isChannelError(node: ESTree.Node): boolean {
      const direct = argumentOf(node);
      if (direct !== undefined && callsAny(direct, ['die'], 'die')) {
        return false;
      }
      if (direct !== undefined && callsAny(direct, ['fail'], 'fail')) {
        return true;
      }
      const fn = enclosingFunction(node);
      if (fn === undefined) {
        return false;
      }
      if (!isReturnedNode(node)) {
        return false;
      }
      const user = argumentOf(fn);
      if (user !== undefined) {
        return (
          ERROR_MAPPERS.some(({ kind, name }) => isModuleCall(user, bindings, kind, name)) ||
          isModuleCall(user, bindings, 'deferred', 'failSync')
        );
      }
      const property = outerParent(fn);
      if (property?.type !== 'Property' || getStaticPropertyName(property.key) !== 'catch') {
        return false;
      }
      const options = parentOf(property);
      const tryCall = options === undefined ? undefined : argumentOf(options);
      return (
        tryCall !== undefined &&
        (isModuleCall(tryCall, bindings, 'effect', 'try') ||
          isModuleCall(tryCall, bindings, 'effect', 'tryPromise'))
      );
    }

    function check(node: ESTree.NewExpression | ESTree.CallExpression): void {
      const callee = unwrapExpression(node.callee);
      if (callee?.type !== 'Identifier' || callee.name !== 'Error' || !isChannelError(node)) {
        return;
      }
      context.report({ messageId: 'error', node });
    }
  },
});
