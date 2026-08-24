import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  getJsxAttrValue,
  getNavOptionObjects,
  getObjectPropValue,
  getStaticRoutePathValue,
  isExternalHref,
  isRouterNavCall,
  isRouterNavJsx,
  isStaticRoutePath,
} from '../router.ts';

function reportIfBannedHref(
  report: (descriptor: { messageId: 'routerHref'; node: ESTree.Node }) => void,
  hrefValue: ESTree.Node | undefined,
): void {
  if (hrefValue === undefined) {
    return;
  }
  if (isStaticRoutePath(hrefValue)) {
    const value = getStaticRoutePathValue(hrefValue);
    if (value !== undefined && isExternalHref(value)) {
      return;
    }
  }
  report({ messageId: 'routerHref', node: hrefValue });
}

export const noRouterHrefName = bnRuleName('no-href');

export const noRouterHref: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow `href` on TanStack Router navigation APIs except external URL literals',
    },
    messages: {
      routerHref:
        'Do not use `href` for in-app navigation. Prefer typed `to` with `params`/`search`. External links may use a literal `http(s):` / `mailto:` / `tel:` / `//` href.',
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
        reportIfBannedHref(context.report, getJsxAttrValue(node, 'href'));
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
          reportIfBannedHref(context.report, getObjectPropValue(optionsObject, 'href'));
        }
      },
    };
  },
});
