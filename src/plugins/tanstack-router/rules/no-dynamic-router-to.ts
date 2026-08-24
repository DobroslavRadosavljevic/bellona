import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  getJsxAttrValue,
  getNavOptionObjects,
  getObjectPropValue,
  isDynamicRoutePath,
  isRouterNavCall,
  isRouterNavJsx,
} from '../router.ts';

function reportIfDynamicTo(
  report: (descriptor: { messageId: 'dynamicTo'; node: ESTree.Node }) => void,
  toValue: ESTree.Node | undefined,
): void {
  if (toValue === undefined) {
    return;
  }
  if (isDynamicRoutePath(toValue)) {
    report({ messageId: 'dynamicTo', node: toValue });
  }
}

export const noDynamicRouterToName = bnRuleName('tanstack-router', 'no-dynamic-to');

export const noDynamicRouterTo: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require static string-literal `to` on TanStack Router Link/navigate/redirect APIs',
    },
    messages: {
      dynamicTo:
        'Use a string-literal route path for `to` (e.g. `"/posts/$postId"`) with `params`/`search`, or pass a typed `linkOptions(...)` object. Do not interpolate, concatenate, or pass a variable.',
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
        reportIfDynamicTo(context.report, getJsxAttrValue(node, 'to'));
      },
      CallExpression(node) {
        if (!isRouterNavCall(node)) {
          return;
        }
        const first = node.arguments[0];
        if (first === undefined || first.type === 'SpreadElement') {
          return;
        }
        for (const optionsObject of getNavOptionObjects(first)) {
          reportIfDynamicTo(context.report, getObjectPropValue(optionsObject, 'to'));
        }
      },
    };
  },
});
