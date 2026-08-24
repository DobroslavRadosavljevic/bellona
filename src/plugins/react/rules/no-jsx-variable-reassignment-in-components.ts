import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { expressionContainsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxVariableReassignmentInComponentsName = bnRuleName(
  'react',
  'no-jsx-variable-reassignment-in-components',
);

export const noJsxVariableReassignmentInComponents: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow building JSX by reassigning local variables in React components',
    },
    messages: {
      reassign:
        'Do not build JSX by reassigning local variables inside React components. Render the conditional UI inline or extract a component.',
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
      AssignmentExpression(node) {
        if (node.left.type !== 'Identifier') {
          return;
        }
        if (!expressionContainsJsx(node.right, context.sourceCode.visitorKeys)) {
          return;
        }

        const enclosing = getEnclosingFunctionName(node);
        if (!isComponentName(enclosing)) {
          return;
        }

        context.report({ messageId: 'reassign', node });
      },
    };
  },
});
