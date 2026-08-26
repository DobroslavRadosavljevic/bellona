import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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

export const noDynamicRouterToName = bnRuleName('no-dynamic-to');

export const noDynamicRouterTo: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require static string-literal `to` on TanStack Router Link/navigate/redirect APIs',
    },
    messages: {
      dynamicTo: agentDiagnostic({
        problem:
          '`to` is not a string-literal route path (interpolation, concatenation, or a variable). This applies to `Link` / `Navigate` / `navigate` / `redirect` / `linkOptions` / `buildLocation` / `preloadRoute`.',
        why: 'The router infers `params` and `search` from a literal path such as `"/posts/$postId"`. A dynamic string is just `string`, so types and mismatches disappear.',
        fix: 'Write `to: "/posts/$postId"` (or `to="/posts/$postId"`) and pass values in `params` / `search`. Or pass a typed `linkOptions({ to: "/…", params })` object. Do not interpolate ids into `to`.',
        avoid:
          'Do not assert `to as "/posts/$postId"`. Do not use `href` instead. Do not disable the rule.',
      }),
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
