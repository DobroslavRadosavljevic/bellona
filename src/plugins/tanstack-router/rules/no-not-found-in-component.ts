import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectRouteUiBindingNames,
  collectRouterEdgeBindings,
  isControlFlowNotFoundCall,
  isInsideAllowedNotFoundSite,
  isInsideRouteUi,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';

export const noNotFoundInComponentName = bnRuleName('no-not-found-in-component');

export const noNotFoundInComponent: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `notFound()` inside route components and other route UI options',
    },
    messages: {
      notFoundInComponent: agentDiagnostic({
        problem:
          '`notFound()` is called inside a route component (or pending / error / not-found UI).',
        why: 'A throw during render flickers and leaves loader data untyped. The throw belongs in the loader.',
        fix: 'Throw `notFound()` in `loader` or `beforeLoad` after you load the record. Keep the component for render only.',
        avoid: 'Do not throw `notFound()` from `notFoundComponent`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;
    let uiNames: ReadonlySet<string>;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectRouterEdgeBindings(program);
        uiNames = collectRouteUiBindingNames(program);
      },
      CallExpression(node) {
        if (!isControlFlowNotFoundCall(node, bindings)) {
          return;
        }
        if (isInsideAllowedNotFoundSite(node, bindings)) {
          return;
        }
        if (!isInsideRouteUi(node, uiNames)) {
          return;
        }
        context.report({ messageId: 'notFoundInComponent', node });
      },
    };
  },
});
