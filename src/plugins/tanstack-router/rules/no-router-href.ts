import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
      routerHref: agentDiagnostic({
        problem:
          'This in-app link uses `href`. Typed app routes must use `to` with `params` / `search`. Literal external `href` is allowed only when it starts with `http:`, `https:`, `mailto:`, `tel:`, or `//`.',
        why: '`href` is an untyped URL string. The router will not check params or search.',
        fix: 'Replace with `<Link to="/posts/$postId" />` plus a `params` object `{ postId }` (or `navigate({ to, params })`). Keep `href` only for real external URLs with those prefixes.',
        avoid: 'Do not put an in-app path in `href` (`href="/posts"`). Do not disable the rule.',
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
