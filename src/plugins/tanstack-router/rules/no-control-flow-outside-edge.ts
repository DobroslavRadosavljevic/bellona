import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectRouterEdgeBindings,
  isControlFlowNotFoundCall,
  isControlFlowRedirectCall,
  programDefinesRouterEdge,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';

export const noControlFlowOutsideEdgeName = bnRuleName('no-control-flow-outside-edge');

export const noControlFlowOutsideEdge: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep `notFound()` and `redirect()` in route modules or `createServerFn` handlers',
    },
    messages: {
      notFound: agentDiagnostic({
        problem:
          '`notFound()` is called in a module that does not define a route or a `createServerFn`.',
        why: '`notFound()` is route control flow. A helper then ties every caller to the router.',
        fix: 'Return data from this helper (`null` or a result). Call `throw notFound()` in the route `loader` or `beforeLoad`, or in a `createServerFn` handler.',
        avoid: 'Do not wrap `notFound` in `assertFound`. Do not disable the rule.',
      }),
      redirect: agentDiagnostic({
        problem:
          '`redirect()` is called in a module that does not define a route or a `createServerFn`.',
        why: '`redirect()` is route control flow. A helper then ties every caller to the router.',
        fix: 'Return a result from this helper. Call `throw redirect({ to })` in the route `beforeLoad` or `loader`, or in a `createServerFn` handler.',
        avoid: 'Do not wrap `redirect` in `requireAuth`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;
    let hasEdge: boolean;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectRouterEdgeBindings(program);
        hasEdge = programDefinesRouterEdge(program);
      },
      CallExpression(node) {
        if (hasEdge) {
          return;
        }
        if (isControlFlowNotFoundCall(node, bindings)) {
          context.report({ messageId: 'notFound', node });
          return;
        }
        if (isControlFlowRedirectCall(node, bindings)) {
          context.report({ messageId: 'redirect', node });
        }
      },
    };
  },
});
