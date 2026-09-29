import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipReactFile } from '../options.ts';

export const noForwardRefName = bnRuleName('no-forward-ref');

const REACT_SOURCES = new Set(['react']);

export const noForwardRef: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow `forwardRef` from React. In React 19, `ref` is a prop',
    },
    messages: {
      forwardRef: agentDiagnostic({
        problem: 'This component uses `forwardRef` from React.',
        why: 'In React 19 a function component gets `ref` as a normal prop. React plans to deprecate `forwardRef`.',
        fix: 'Remove the `forwardRef` call. Read `ref` from props (`function Input({ ref, ...props }: InputProps)`) and add `ref?: Ref<HTMLInputElement>` to the props type. `ComponentProps<"input">` already has `ref`.',
        avoid:
          'Do not drop the ref: pass it on to the same element. Do not rename the prop to `innerRef`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const forwardRefBindings = new Set<string>();
    const namespaceBindings = new Set<string>();

    return {
      before() {
        forwardRefBindings.clear();
        namespaceBindings.clear();
        namespaceBindings.add('React');
        if (shouldSkipReactFile(context)) {
          return false;
        }
      },
      ImportDeclaration(node) {
        if (!REACT_SOURCES.has(node.source.value)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            if (getStaticPropertyName(specifier.imported) === 'forwardRef') {
              forwardRefBindings.add(specifier.local.name);
            }
            continue;
          }
          namespaceBindings.add(specifier.local.name);
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee === undefined) {
          return;
        }
        if (callee.type === 'Identifier' && forwardRefBindings.has(callee.name)) {
          context.report({ messageId: 'forwardRef', node: callee });
          return;
        }
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          getStaticPropertyName(callee.property) === 'forwardRef'
        ) {
          const object = unwrapExpression(callee.object);
          if (object?.type === 'Identifier' && namespaceBindings.has(object.name)) {
            context.report({ messageId: 'forwardRef', node: callee });
          }
        }
      },
    };
  },
});
