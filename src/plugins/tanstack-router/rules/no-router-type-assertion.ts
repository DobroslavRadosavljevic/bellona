import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  getCallTypeArguments,
  getJsxAttrValue,
  getNavOptionObjects,
  getObjectPropValue,
  hasTypeAssertionWrapper,
  isRouterHookCall,
  isRouterNavCall,
  isRouterNavJsx,
} from '../router.ts';

function reportIfAsserted(
  report: (descriptor: { messageId: 'assertedToFrom' | 'assertedHook'; node: ESTree.Node }) => void,
  value: ESTree.Node | undefined,
  messageId: 'assertedToFrom' | 'assertedHook',
): void {
  if (value !== undefined && hasTypeAssertionWrapper(value)) {
    report({ messageId, node: value });
  }
}

export const noRouterTypeAssertionName = bnRuleName('tanstack-router', 'no-type-assertion');

export const noRouterTypeAssertion: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow type assertions and annotations that bypass TanStack Router inference',
    },
    messages: {
      assertedToFrom:
        'Do not type-assert `to` / `from`. Use a string-literal route path or typed `linkOptions`.',
      assertedHook:
        'Do not annotate or cast TanStack Router hook results. Let inference flow from `from` / the route API.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      JSXOpeningElement(node) {
        if (!isRouterNavJsx(node)) {
          return;
        }
        reportIfAsserted(context.report, getJsxAttrValue(node, 'to'), 'assertedToFrom');
        reportIfAsserted(context.report, getJsxAttrValue(node, 'from'), 'assertedToFrom');
      },
      CallExpression(node) {
        if (isRouterNavCall(node)) {
          const first = node.arguments[0];
          if (first !== undefined && first.type !== 'SpreadElement') {
            for (const optionsObject of getNavOptionObjects(first)) {
              reportIfAsserted(
                context.report,
                getObjectPropValue(optionsObject, 'to'),
                'assertedToFrom',
              );
              reportIfAsserted(
                context.report,
                getObjectPropValue(optionsObject, 'from'),
                'assertedToFrom',
              );
            }
          }
        }

        if (!isRouterHookCall(node)) {
          return;
        }

        if (getCallTypeArguments(node) !== undefined) {
          context.report({ messageId: 'assertedHook', node });
        }

        const { parent } = node;
        if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
          const annotation = parent.id.typeAnnotation;
          if (annotation !== undefined && annotation !== null) {
            context.report({ messageId: 'assertedHook', node: parent.id });
          }
        }
      },
      TSAsExpression(node) {
        const expression = unwrapExpression(node.expression);
        if (expression?.type === 'CallExpression' && isRouterHookCall(expression)) {
          context.report({ messageId: 'assertedHook', node });
        }
      },
      TSTypeAssertion(node) {
        const expression = unwrapExpression(node.expression);
        if (expression?.type === 'CallExpression' && isRouterHookCall(expression)) {
          context.report({ messageId: 'assertedHook', node });
        }
      },
      TSNonNullExpression(node) {
        const expression = unwrapExpression(node.expression);
        if (expression?.type === 'CallExpression' && isRouterHookCall(expression)) {
          context.report({ messageId: 'assertedHook', node });
        }
      },
    };
  },
});
