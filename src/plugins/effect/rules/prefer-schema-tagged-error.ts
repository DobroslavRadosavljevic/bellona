import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

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

export const preferSchemaTaggedErrorName = bnRuleName('effect', 'prefer-schema-tagged-error');

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
      errorClass: 'Define domain errors with Schema.TaggedError.',
      dataTagged: 'Use Schema.TaggedError instead of Data.TaggedError.',
      failError: 'Fail with Schema.TaggedError instead of new Error(...).',
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
