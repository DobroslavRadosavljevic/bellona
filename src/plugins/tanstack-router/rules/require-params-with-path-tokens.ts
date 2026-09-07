import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { pathHasRequiredParamToken } from '../route.ts';
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
  if (path === undefined || !pathHasRequiredParamToken(path)) {
    return;
  }
  report({ messageId: 'missingParams', node: toValue });
}

export const requireParamsWithPathTokensName = bnRuleName('require-params-with-path-tokens');

export const requireParamsWithPathTokens: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `params` when `to` includes a required `$` token and `from` is not set to inherit params',
    },
    messages: {
      missingParams: agentDiagnostic({
        problem: '`to` contains a required `$` path token but this call has no `params` object.',
        why: 'Required tokens such as `$postId` need a `params` object. Optional tokens such as `{-$locale}` do not.',
        fix: 'Keep the literal path and pass params: `navigate({ to: "/posts/$postId", params: { postId } })` or the same `params` object on `<Link to="/posts/$postId" />`.',
        avoid: 'Do not write `to: `/posts/${id}``. Do not disable the rule.',
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
