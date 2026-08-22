import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, getStaticPropertyName, isFunctionLike } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { functionReturnsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noRenderHelperFunctionsInComponentsName = vmRuleName(
  'no-render-helper-functions-in-components',
);

export const noRenderHelperFunctionsInComponents: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX-returning helper functions inside React components',
    },
    messages: {
      insideComponent:
        'Do not define JSX-returning functions inside React components. Split conditional UI into named subcomponent files.',
      nonComponent:
        'Only React components may return JSX. Rename this JSX-returning function as a component or extract a component file.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const check = (
      reportNode: ESTree.Node,
      functionNode: ESTree.Function | ESTree.ArrowFunctionExpression,
    ) => {
      if (!functionReturnsJsx(functionNode, context.sourceCode.visitorKeys)) {
        return;
      }

      const enclosing = getEnclosingFunctionName(functionNode);
      const functionName =
        getStaticPropertyName(reportNode) ??
        (reportNode.type === 'Identifier' ? reportNode.name : undefined);

      if (!isComponentName(enclosing) && isComponentName(functionName)) {
        return;
      }

      context.report({
        messageId: isComponentName(enclosing) ? 'insideComponent' : 'nonComponent',
        node: reportNode,
      });
    };

    return {
      before() {
        if (shouldSkipJsxFile(context)) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        check(node.id ?? node, node);
      },
      VariableDeclarator(node) {
        if (!isFunctionLike(node.init)) {
          return;
        }
        check(node.id.type === 'Identifier' ? node.id : node, node.init);
      },
    };
  },
});
