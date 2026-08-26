import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, isAtModuleScope, isFunctionLike } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { expressionContainsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxLocalConstantsInComponentsName = bnRuleName(
  'no-jsx-local-constants-in-components',
);

export const noJsxLocalConstantsInComponents: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX assigned to local const inside React components',
    },
    messages: {
      localConst: agentDiagnostic({
        problem: 'This React component assigns JSX to a local `const` (`const node = <div />`).',
        why: 'JSX stored in a variable is not a component. It skips the usual composition boundary and makes lists/conditionals harder to type and extract.',
        fix: 'Render the JSX inline in the return, or extract a child component file (`function Title() { return <h1 /> }`) and render `<Title />`.',
        avoid:
          'Do not switch `const` to `let` (reassignment is also banned). Do not wrap JSX in a render helper inside the component. Do not disable the rule.',
      }),
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
