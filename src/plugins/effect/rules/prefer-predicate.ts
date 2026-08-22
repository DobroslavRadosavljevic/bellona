import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

const PREDICATE_NAMES = new Set([
  'isString',
  'isObject',
  'isRecord',
  'isNumber',
  'isBoolean',
  'isUndefined',
  'isNull',
  'isFunction',
  'isDate',
  'isPromise',
  'isError',
  'isNullish',
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
        'Use Predicate.isString / isObject / isNumber instead of local type-guard helpers',
    },
    messages: {
      predicate: 'Use Predicate.{{name}} instead of a local {{name}} helper.',
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
      if (name === undefined || !PREDICATE_NAMES.has(name)) {
        return;
      }
      context.report({
        messageId: 'predicate',
        node: node.type === 'FunctionDeclaration' && node.id !== null ? node.id : node,
        data: { name },
      });
    }
  },
});
