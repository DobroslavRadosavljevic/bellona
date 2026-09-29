import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleMember, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

const EFFECT_REPLACEMENTS = new Map<string, string>([
  ['catchAll', 'Effect.catch'],
  ['catchAllCause', 'Effect.catchCause'],
  ['catchAllDefect', 'Effect.catchDefect'],
  ['catchSome', 'Effect.catchFilter'],
  ['catchSomeCause', 'Effect.catchCauseFilter'],
  ['catchSomeDefect', 'Effect.catchDefect (die again for defects you do not handle)'],
  ['tapErrorCause', 'Effect.tapCause'],
  ['ignoreLogged', 'Effect.ignore({ log: true })'],
  ['optionFromOptional', 'Effect.catchNoSuchElement'],
  ['makeSemaphore', 'Semaphore.make'],
  ['unsafeMakeSemaphore', 'Semaphore.makeUnsafe'],
  ['makeLatch', 'Latch.make'],
  ['unsafeMakeLatch', 'Latch.makeUnsafe'],
  ['dieMessage', 'Effect.die(new Error(message))'],
  ['async', 'Effect.callback'],
  ['asyncEffect', 'Effect.callback'],
  ['either', 'Effect.result'],
  ['zipRight', 'Effect.andThen'],
  ['zipLeft', 'Effect.tap'],
  ['fork', 'Effect.forkChild'],
  ['forkDaemon', 'Effect.forkDetach'],
  ['forkAll', 'Effect.forEach + Effect.forkChild'],
  ['forkWithErrorHandler', 'Effect.forkChild + Fiber.await'],
]);

const LAYER_REPLACEMENTS = new Map<string, string>([
  ['scoped', 'Layer.effect'],
  ['scopedDiscard', 'Layer.effectDiscard'],
  ['scopedContext', 'Layer.effectContext'],
  ['catchAll', 'Layer.catch'],
  ['catchAllCause', 'Layer.catchCause'],
  ['tapErrorCause', 'Layer.tapCause'],
]);

/** From the Effect `migration/v3-to-v4.md` reference. Each v4 name exists in `effect@4.0.0-rc.115`. */
const STREAM_REPLACEMENTS = new Map<string, string>([
  ['async', 'Stream.callback'],
  ['asyncEffect', 'Stream.callback'],
  ['asyncPush', 'Stream.callback'],
  ['asyncScoped', 'Stream.callback'],
  ['repeatEffect', 'Stream.fromEffectRepeat'],
  ['repeatEffectWithSchedule', 'Stream.fromEffectSchedule'],
  ['repeatEffectChunk', 'Stream.fromIterableEffectRepeat'],
  ['fromChunk', 'Stream.fromArray'],
  ['fromChunks', 'Stream.fromArrays'],
  ['mapChunks', 'Stream.mapArray'],
  ['mapChunksEffect', 'Stream.mapArrayEffect'],
  ['either', 'Stream.result'],
  ['flattenChunks', 'Stream.flattenArray'],
  ['flattenIterables', 'Stream.flattenIterable'],
  ['mergeEither', 'Stream.mergeResult'],
  ['zipWithChunks', 'Stream.zipWithArray'],
  ['bufferChunks', 'Stream.bufferArray'],
  ['combineChunks', 'Stream.combineArray'],
  ['catchAll', 'Stream.catch'],
  ['catchAllCause', 'Stream.catchCause'],
  ['catchSome', 'Stream.catchFilter'],
  ['catchSomeCause', 'Stream.catchCauseFilter'],
  ['tapErrorCause', 'Stream.tapCause'],
]);

const SCOPE_REPLACEMENTS = new Map<string, string>([['extend', 'Scope.provide']]);

const PREDICATE_REPLACEMENTS = new Map<string, string>([
  ['isRecord', 'Predicate.isObject'],
  ['isNullable', 'Predicate.isNullish'],
  ['isNotNullable', 'Predicate.isNotNullish'],
  ['isReadonlyRecord', 'Predicate.isReadonlyObject'],
]);

/** v3 Schema names. `Schema.Date` is the v4 schema for `Date` instances. */
const SCHEMA_REPLACEMENTS = new Map<string, string>([
  ['DateFromSelf', 'Schema.Date'],
  ['DateFromNumber', 'Schema.DateFromMillis'],
]);

export const noV3EffectApisName = bnRuleName('no-v3-apis');

function v3ApiOf(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): { api: string; replacement: string } | undefined {
  for (const [name, replacement] of EFFECT_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'effect', name)) {
      return { api: `Effect.${name}`, replacement };
    }
  }
  for (const [name, replacement] of LAYER_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'layer', name)) {
      return { api: `Layer.${name}`, replacement };
    }
  }
  for (const [name, replacement] of STREAM_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'stream', name)) {
      return { api: `Stream.${name}`, replacement };
    }
  }
  for (const [name, replacement] of SCOPE_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'scope', name)) {
      return { api: `Scope.${name}`, replacement };
    }
  }
  for (const [name, replacement] of SCHEMA_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'schema', name)) {
      return { api: `Schema.${name}`, replacement };
    }
  }
  for (const [name, replacement] of PREDICATE_REPLACEMENTS) {
    if (isModuleMember(node, bindings, 'predicate', name)) {
      return { api: `Predicate.${name}`, replacement };
    }
  }
  return undefined;
}

function isCalleeOfCall(node: ESTree.Node): boolean {
  const parent = node.parent;
  return parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node;
}

export const noV3EffectApis: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Effect v3 combinators and Schema names that were renamed or removed in Effect v4',
    },
    messages: {
      renamed: agentDiagnostic({
        problem: '`{{api}}` is an Effect v3 API. The v4 replacement is `{{replacement}}`.',
        why: 'v3 names do not exist or mean something else on Effect v4 (`effect@rc`). Mixing them breaks types and runtime.',
        fix: 'Replace `{{api}}` with `{{replacement}}`. For `catchSome*`, turn the `Option` handler into a `Filter`, or use `catchIf` / `catchCauseIf` for a boolean check. Check each call site: some v4 names take new options. `Schema.Date` accepts `Date` instances. For ISO strings, use `Schema.DateFromString`.',
        avoid: 'Do not keep the v3 name behind a local alias. Do not disable the rule.',
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
        const found = v3ApiOf(unwrapExpression(node.callee), bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
      MemberExpression(node) {
        if (isCalleeOfCall(node)) {
          return;
        }
        const found = v3ApiOf(node, bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
      Identifier(node) {
        if (isCalleeOfCall(node)) {
          return;
        }
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed)
        ) {
          return;
        }
        const found = v3ApiOf(node, bindings);
        if (found === undefined) {
          return;
        }
        context.report({ messageId: 'renamed', node, data: found });
      },
    };
  },
});
