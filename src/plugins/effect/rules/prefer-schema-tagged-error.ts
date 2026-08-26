import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isInsideSuperClass, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const preferSchemaTaggedErrorName = bnRuleName('prefer-schema-tagged-error');

function calleeRoot(node: ESTree.Node | undefined): ESTree.Node | undefined {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    current = unwrapExpression(current.callee);
  }
  return current;
}

function isSchemaTaggedErrorSuper(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  return isModuleMember(calleeRoot(node), bindings, 'schema', 'TaggedError');
}

function isDataTaggedErrorSuper(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  return isModuleMember(calleeRoot(node), bindings, 'data', 'TaggedError');
}

export const preferSchemaTaggedError: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Schema.TaggedError over Error subclasses and Data.TaggedError',
    },
    messages: {
      errorClass: agentDiagnostic({
        problem:
          'This domain error is a plain `class X extends Error` (or similar) instead of `Schema.TaggedError`.',
        why: 'Effect v4 typed errors need a `_tag` and a schema. A raw `Error` subclass is not channel `E`.',
        fix: 'Define `export class Boom extends Schema.TaggedError<Boom>()("Boom", { message: Schema.String }) {}` and `yield*` / `Effect.fail` that class.',
        avoid: 'Do not keep `extends Error` and add a `_tag` by hand. Do not disable the rule.',
      }),
      dataTagged: agentDiagnostic({
        problem:
          'This uses `Data.TaggedError`. Effect v4 domain errors should be `Schema.TaggedError`.',
        why: '`Data.TaggedError` is the older data-class style. Schema-tagged errors decode and type as Schema.',
        fix: 'Replace with `class Boom extends Schema.TaggedError<Boom>()("Boom", { … }) {}`.',
        avoid:
          'Do not mix `Data.TaggedError` and `Schema.TaggedError` for the same error. Do not disable the rule.',
      }),
      failError: agentDiagnostic({
        problem: 'This fails with `new Error(...)` instead of a `Schema.TaggedError`.',
        why: '`Error` is a defect-shaped value, not a typed `E` in the Effect channel.',
        fix: 'Construct your `Schema.TaggedError` and `return yield* new Boom({ message })` or `Effect.fail(new Boom({ … }))`.',
        avoid: 'Do not `Effect.die` to hide it. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      ClassDeclaration(node) {
        reportClass(node);
      },
      ClassExpression(node) {
        reportClass(node);
      },
      CallExpression(node) {
        if (isModuleCall(node, bindings, 'data', 'TaggedError')) {
          if (isInsideSuperClass(node)) {
            return;
          }
          context.report({ messageId: 'dataTagged', node });
          return;
        }
        if (!isModuleCall(node, bindings, 'effect', 'fail')) {
          return;
        }
        const first = node.arguments[0];
        if (first === undefined || first.type === 'SpreadElement') {
          return;
        }
        const argument = unwrapExpression(first);
        if (argument?.type !== 'NewExpression') {
          return;
        }
        const callee = unwrapExpression(argument.callee);
        if (callee?.type === 'Identifier' && callee.name === 'Error') {
          context.report({ messageId: 'failError', node });
        }
      },
    };

    function reportClass(node: ESTree.Class): void {
      const superClass = node.superClass ?? undefined;
      if (isSchemaTaggedErrorSuper(superClass, bindings)) {
        return;
      }
      if (isDataTaggedErrorSuper(superClass, bindings)) {
        context.report({ messageId: 'dataTagged', node });
        return;
      }
      const expression = unwrapExpression(superClass);
      if (expression?.type === 'Identifier' && expression.name === 'Error') {
        context.report({ messageId: 'errorClass', node });
      }
    }
  },
});
