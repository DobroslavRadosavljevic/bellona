import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getEnclosingFunctionName, isFunctionLike, unwrapExpression } from '../ast.ts';
import { isComponentName } from '../filename.ts';
import { functionReturnsJsx } from '../jsx.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noJsxIifeInComponentsName = bnRuleName('no-jsx-iife-in-components');

export const noJsxIifeInComponents: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX-returning IIFEs inside React components',
    },
    messages: {
      iife: agentDiagnostic({
        problem:
          'This React component hides JSX inside an immediately invoked function (`(() => <div />)()` or similar).',
        why: 'An IIFE is a fake block scope. Conditional UI then lives in a nested function instead of in the render tree, which hides hooks rules and makes extraction harder.',
        fix: 'Render the JSX inline with `&&` / ternaries, or extract a named child component file and render `<Child />`.',
        avoid:
          'Do not wrap the IIFE in `useMemo`. Do not assign it to a local const (that is also banned). Do not disable the rule.',
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
