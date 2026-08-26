import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isAtModuleScope, isFunctionLike } from '../ast.ts';
import { expressionContainsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxModuleConstantsName = bnRuleName('no-jsx-module-constants');

export const noJsxModuleConstants: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX assigned to module-level const; extract a component instead',
    },
    messages: {
      moduleConst: agentDiagnostic({
        problem: 'This module assigns JSX to a module-level `const` (`const icon = <Svg />`).',
        why: 'Module-level JSX is created once and reused as an element, not as a component. It cannot take props cleanly and is easy to share by accident.',
        fix: 'Move the JSX into a component file (PascalCase). Export that component and render `<Icon />` (pass props as needed).',
        avoid:
          'Do not wrap the element in a function that is not a component (`function getIcon()`). Do not disable the rule.',
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
