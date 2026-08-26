import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, getStaticPropertyName, isFunctionLike } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { functionReturnsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noRenderHelperFunctionsInComponentsName = bnRuleName(
  'no-render-helper-functions-in-components',
);

export const noRenderHelperFunctionsInComponents: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX-returning helper functions inside React components',
    },
    messages: {
      insideComponent: agentDiagnostic({
        problem:
          'This React component defines an inner function that returns JSX (a render helper such as `const renderTitle = () => <h1 />`).',
        why: 'Inner render helpers hide component boundaries. They are easy to use with hooks incorrectly and they block extraction.',
        fix: 'Move the JSX into a named child component in its own file (or a PascalCase component in a file that allows it). Render `<Child />` from the parent.',
        avoid:
          'Do not rename the helper to PascalCase while it stays nested inside the parent. Nested components still remount. Extract a file. Do not disable the rule.',
      }),
      nonComponent: agentDiagnostic({
        problem:
          'This function returns JSX but is not a React component (it is not PascalCase). Only components may return JSX.',
        why: 'A camelCase function that returns JSX is a hidden component. File naming and the rules of hooks will not apply.',
        fix: 'Rename it to PascalCase and treat it as a component in its own file, or inline the JSX in a real component.',
        avoid: 'Do not return JSX from utils/helpers. Do not disable the rule.',
      }),
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
