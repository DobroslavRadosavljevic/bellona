import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, isFunctionLike } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { functionReturnsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxIifeInComponentsName = vmRuleName('no-jsx-iife-in-components');

export const noJsxIifeInComponents: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX-returning IIFEs inside React components',
    },
    messages: {
      iife: 'Do not hide JSX in immediately invoked functions inside React components. Render the conditional UI inline or extract a component.',
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
        if (node.init?.type !== 'CallExpression' || !isFunctionLike(node.init.callee)) {
          return;
        }

        const callee = node.init.callee;

        if (!functionReturnsJsx(callee, context.sourceCode.visitorKeys)) {
          return;
        }

        const enclosing = getEnclosingFunctionName(node);
        if (!isComponentName(enclosing)) {
          return;
        }

        context.report({ messageId: 'iife', node });
      },
    };
  },
});
