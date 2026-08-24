import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { pathHasParamToken } from '../route.ts';
import {
  getJsxAttrValue,
  getNavOptionObjects,
  getObjectPropValue,
  getStaticRoutePathValue,
  isRouterNavCall,
  isRouterNavJsx,
  objectHasOwnProperty,
} from '../router.ts';

function reportIfMissingParams(
  report: (descriptor: { messageId: 'missingParams'; node: ESTree.Node }) => void,
  toValue: ESTree.Node | undefined,
  hasParams: boolean,
): void {
  if (toValue === undefined || hasParams) {
    return;
  }
  const path = getStaticRoutePathValue(toValue);
  if (path === undefined || !pathHasParamToken(path)) {
    return;
  }
  report({ messageId: 'missingParams', node: toValue });
}

export const requireParamsWithPathTokensName = bnRuleName(
  'tanstack-router',
  'require-params-with-path-tokens',
);

export const requireParamsWithPathTokens: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `params` when `to` includes a `$` token and `from` is not set to inherit params',
    },
    messages: {
      missingParams:
        'Pass a `params` object for `$` tokens in `to` (e.g. `to: "/posts/$postId", params: { postId }`). Do not interpolate the value into `to`.',
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
        reportIfMissingParams(
          context.report,
          getJsxAttrValue(node, 'to'),
          getJsxAttrValue(node, 'params') !== undefined ||
            getJsxAttrValue(node, 'from') !== undefined,
        );
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
          reportIfMissingParams(
            context.report,
            getObjectPropValue(optionsObject, 'to'),
            objectHasOwnProperty(optionsObject, 'params') ||
              objectHasOwnProperty(optionsObject, 'from'),
          );
        }
      },
    };
  },
});
