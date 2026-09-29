import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { propertyName } from '../ast.ts';
import { clientMethod, isQueryClient } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

const REPLACEMENTS = new Map([
  ['fetchQuery', 'query(options). Check select behavior when reusing observer options.'],
  [
    'fetchInfiniteQuery',
    'infiniteQuery(options). Check select behavior when reusing observer options.',
  ],
  [
    'prefetchQuery',
    'query(options).catch(noop). Import noop from @tanstack/react-query. The new method returns data and rejects on errors.',
  ],
  [
    'prefetchInfiniteQuery',
    'infiniteQuery(options).catch(noop). Import noop from @tanstack/react-query. The new method returns data and rejects on errors.',
  ],
  [
    'ensureQueryData',
    "query({ ...options, staleTime: 'static' }). Review revalidateIfStale: this replacement does not start a background refresh.",
  ],
  [
    'ensureInfiniteQueryData',
    "infiniteQuery({ ...options, staleTime: 'static' }). Review revalidateIfStale: this replacement does not start a background refresh.",
  ],
]);

export const noDeprecatedClientMethodsName = bnRuleName('no-deprecated-client-methods');
export const noDeprecatedClientMethods: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Replace the six deprecated QueryClient fetch, prefetch, and ensure methods',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      deprecated: agentDiagnostic({
        problem: '`{{name}}` is deprecated and will be removed in v6.',
        why: 'Current TanStack Query uses query and infiniteQuery for these operations.',
        fix: 'Use {{replacement}}',
        avoid:
          'Do not rename blindly. Check error handling, return values, select, and cache refresh behavior.',
      }),
    },
  },
  createOnce(context) {
    return {
      before() {
        if (skipFile(context, true)) return false;
      },
      MemberExpression(node) {
        const name = clientMethod(context, node);
        const replacement = name === undefined ? undefined : REPLACEMENTS.get(name);
        if (name !== undefined && replacement !== undefined)
          context.report({
            node: node.property,
            messageId: 'deprecated',
            data: { name, replacement },
          });
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern' || !isQueryClient(context, node.init)) return;
        for (const property of node.id.properties) {
          if (property.type !== 'Property') continue;
          const name = propertyName(property.key, property.computed);
          const replacement = name === undefined ? undefined : REPLACEMENTS.get(name);
          if (name !== undefined && replacement !== undefined)
            context.report({
              node: property.key,
              messageId: 'deprecated',
              data: { name, replacement },
            });
        }
      },
    };
  },
});
