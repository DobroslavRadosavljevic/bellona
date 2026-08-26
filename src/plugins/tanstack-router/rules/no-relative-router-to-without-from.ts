import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import {
  getJsxAttrValue,
  getNavOptionObjects,
  getObjectPropValue,
  getStaticRoutePathValue,
  isRelativeRoutePath,
  isRouterNavCall,
  isRouterNavJsx,
  isStaticRoutePath,
  jsxHasAttr,
  navigateBindingHasFrom,
  objectHasOwnProperty,
} from '../router.ts';

function needsFromForTo(toValue: ESTree.Node | undefined): boolean {
  if (toValue === undefined || !isStaticRoutePath(toValue)) {
    return false;
  }
  const value = getStaticRoutePathValue(toValue);
  return value !== undefined && isRelativeRoutePath(value);
}

export const noRelativeRouterToWithoutFromName = bnRuleName('no-relative-to-without-from');

export const noRelativeRouterToWithoutFrom: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `from` when TanStack Router `to` is a relative path',
    },
    messages: {
      missingFrom: agentDiagnostic({
        problem:
          '`to` is relative (`./`, `../`, or empty) and there is no `from`. Relative targets need an origin route.',
        why: 'Without `from`, the router cannot resolve the path or infer types for relative navigation.',
        fix: 'Add `from={Route.fullPath}` on the `Link` / options, or `useNavigate({ from: "/posts" })` / `navigate({ from, to: "./edit" })`. Prefer a full literal `to: "/posts/$postId"` when you can.',
        avoid:
          'Do not convert the relative path to a guessed absolute string. Do not disable the rule.',
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
        const toValue = getJsxAttrValue(node, 'to');
        if (!needsFromForTo(toValue) || toValue === undefined) {
          return;
        }
        if (jsxHasAttr(node, 'from')) {
          return;
        }
        context.report({ messageId: 'missingFrom', node: toValue });
      },
      CallExpression(node) {
        if (!isRouterNavCall(node)) {
          return;
        }
        const first = node.arguments[0];
        if (first === undefined || first.type === 'SpreadElement') {
          return;
        }
        const optionObjects = getNavOptionObjects(first);
        if (optionObjects.length === 0) {
          return;
        }

        const callee = unwrapExpression(node.callee);
        const bindingHasFrom = callee?.type === 'Identifier' && navigateBindingHasFrom(callee);

        for (const optionsObject of optionObjects) {
          const toValue = getObjectPropValue(optionsObject, 'to');
          if (!needsFromForTo(toValue) || toValue === undefined) {
            continue;
          }
          if (objectHasOwnProperty(optionsObject, 'from') || bindingHasFrom) {
            continue;
          }
          context.report({ messageId: 'missingFrom', node: toValue });
        }
      },
    };
  },
});
