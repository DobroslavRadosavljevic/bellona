import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, isFunctionLike, unwrapExpression } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { functionReturnsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxIifeInComponentsName = bnRuleName('react', 'no-jsx-iife-in-components');

export const noJsxIifeInComponents: CreateOnceRule = defineBellonaRule({
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
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (!isFunctionLike(callee)) {
          return;
        }

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
