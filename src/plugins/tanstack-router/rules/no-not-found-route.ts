import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectRouterEdgeBindings,
  isNotFoundRouteConstruct,
  isNotFoundRouteImportSpecifier,
  isNotFoundRouteProperty,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { TANSTACK_ROUTER_MODULES } from '../router.ts';

const ROUTER_MODULE_SET = new Set<string>(TANSTACK_ROUTER_MODULES);

export const noNotFoundRouteName = bnRuleName('no-not-found-route');

export const noNotFoundRoute: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the deprecated `NotFoundRoute` / `notFoundRoute` API',
    },
    messages: {
      notFoundRoute: agentDiagnostic({
        problem:
          'This code uses the deprecated `NotFoundRoute` API (`NotFoundRoute` or `notFoundRoute`).',
        why: 'When `NotFoundRoute` is present, `notFound()` and `notFoundComponent` do not work.',
        fix: 'Remove `NotFoundRoute` / `notFoundRoute`. Set `notFoundComponent` on the root route, or `defaultNotFoundComponent` on `createRouter`.',
        avoid: 'Do not keep both APIs. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        bindings = collectRouterEdgeBindings(context.sourceCode.ast);
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!isJsString(source) || !ROUTER_MODULE_SET.has(source)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && isNotFoundRouteImportSpecifier(specifier)) {
            context.report({ messageId: 'notFoundRoute', node: specifier });
          }
        }
      },
      Property(node) {
        if (isNotFoundRouteProperty(node)) {
          context.report({ messageId: 'notFoundRoute', node });
        }
      },
      CallExpression(node) {
        reportConstruct(node);
      },
      NewExpression(node) {
        reportConstruct(node);
      },
    };

    function reportConstruct(node: ESTree.CallExpression | ESTree.NewExpression): void {
      if (isNotFoundRouteConstruct(node, bindings)) {
        context.report({ messageId: 'notFoundRoute', node });
      }
    }
  },
});
