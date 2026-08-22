import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isAtModuleScope, isFunctionLike } from '../ast.ts';
import { expressionContainsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxModuleConstantsName = vmRuleName('no-jsx-module-constants');

export const noJsxModuleConstants: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX assigned to module-level const; extract a component instead',
    },
    messages: {
      moduleConst:
        'Do not assign JSX to module-level const variables. Extract a component file and render it with JSX instead.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipJsxFile(context)) {
          return false;
        }
      },
      VariableDeclarator(node) {
        if (
          node.parent.type !== 'VariableDeclaration' ||
          node.parent.kind !== 'const' ||
          !isAtModuleScope(node) ||
          isFunctionLike(node.init)
        ) {
          return;
        }

        if (!expressionContainsJsx(node.init, context.sourceCode.visitorKeys)) {
          return;
        }

        context.report({ messageId: 'moduleConst', node });
      },
    };
  },
});
