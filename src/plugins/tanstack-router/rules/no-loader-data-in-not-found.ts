import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectNotFoundComponentBindingNames,
  collectRouterEdgeBindings,
  isInsideNotFoundComponent,
  isUseLoaderDataCall,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';

export const noLoaderDataInNotFoundName = bnRuleName('no-loader-data-in-not-found');

export const noLoaderDataInNotFound: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `useLoaderData` inside `notFoundComponent`',
    },
    messages: {
      loaderDataInNotFound: agentDiagnostic({
        problem: '`useLoaderData` is called inside `notFoundComponent`.',
        why: 'Loader data may be missing when the not-found UI renders. The hook is not safe there.',
        fix: 'Use `useParams`, `useSearch`, or `useRouteContext`, or pass `notFound({ data })` and read the `data` prop.',
        avoid: 'Do not call `Route.useLoaderData()` here. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;
    let notFoundComponentNames: ReadonlySet<string>;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectRouterEdgeBindings(program);
        notFoundComponentNames = collectNotFoundComponentBindingNames(program);
      },
      CallExpression(node) {
        if (!isUseLoaderDataCall(node, bindings)) {
          return;
        }
        if (!isInsideNotFoundComponent(node, notFoundComponentNames)) {
          return;
        }
        context.report({ messageId: 'loaderDataInNotFound', node });
      },
    };
  },
});
