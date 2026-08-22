import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, isAtModuleScope, isFunctionLike } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { expressionContainsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxLocalConstantsInComponentsName = vmRuleName(
  'no-jsx-local-constants-in-components',
);

export const noJsxLocalConstantsInComponents: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX assigned to local const inside React components',
    },
    messages: {
      localConst:
        'Do not assign JSX to local const variables inside React components. Render it inline or extract a component.',
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
          isAtModuleScope(node) ||
          isFunctionLike(node.init)
        ) {
          return;
        }

        if (!expressionContainsJsx(node.init, context.sourceCode.visitorKeys)) {
          return;
        }

        const enclosing = getEnclosingFunctionName(node);
        if (!isComponentName(enclosing)) {
          return;
        }

        context.report({ messageId: 'localConst', node });
      },
    };
  },
});
