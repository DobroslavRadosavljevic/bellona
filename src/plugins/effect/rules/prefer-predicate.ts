import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

const LOCAL_PREDICATE_REPLACEMENTS = new Map<string, string>([
  ['isString', 'Predicate.isString'],
  ['isObject', 'Predicate.isObject'],
  ['isRecord', 'Predicate.isObject'],
  ['isNumber', 'Predicate.isNumber'],
  ['isBoolean', 'Predicate.isBoolean'],
  ['isUndefined', 'Predicate.isUndefined'],
  ['isNull', 'Predicate.isNull'],
  ['isFunction', 'Predicate.isFunction'],
  ['isDate', 'Predicate.isDate'],
  ['isPromise', 'Predicate.isPromise'],
  ['isError', 'Predicate.isError'],
  ['isNullish', 'Predicate.isNullish'],
  ['isNullable', 'Predicate.isNullish'],
  ['isNotNullable', 'Predicate.isNotNullish'],
  ['isReadonlyRecord', 'Predicate.isReadonlyObject'],
]);

export const preferPredicateName = bnRuleName('prefer-predicate');

function declaredName(node: ESTree.Node): string | undefined {
  if (node.type === 'FunctionDeclaration' && node.id?.type === 'Identifier') {
    return node.id.name;
  }
  if (
    (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
    node.parent?.type === 'VariableDeclarator' &&
    node.parent.id.type === 'Identifier'
  ) {
    return node.parent.id.name;
  }
  return undefined;
}

export const preferPredicate: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use Predicate.isString / isObject instead of local type-guard helpers; v4 isRecord is Predicate.isObject',
    },
    messages: {
      predicate: agentDiagnostic({
        problem:
          'This file defines a local `{{name}}` helper (`isString` / `isObject` / `isNullish` / …). Effect already exports `{{replacement}}`.',
        why: 'Local type guards duplicate `effect/Predicate` and often use `typeof` (also banned). v4 renamed `isRecord` to `isObject` and v3 `isObject` to `isObjectKeyword`.',
        fix: 'Import `{ Predicate }` from `effect/Predicate` (or the namespace you already use) and call `{{replacement}}`. Delete the local helper.',
        avoid: 'Do not keep a local `isRecord`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        report(node);
      },
      FunctionExpression(node) {
        report(node);
      },
      ArrowFunctionExpression(node) {
        report(node);
      },
    };

    function report(node: ESTree.Node): void {
      const name = declaredName(node);
      if (name === undefined) {
        return;
      }
      const replacement = LOCAL_PREDICATE_REPLACEMENTS.get(name);
      if (replacement === undefined) {
        return;
      }
      context.report({
        messageId: 'predicate',
        node: node.type === 'FunctionDeclaration' && node.id !== null ? node.id : node,
        data: { name, replacement },
      });
    }
  },
});
