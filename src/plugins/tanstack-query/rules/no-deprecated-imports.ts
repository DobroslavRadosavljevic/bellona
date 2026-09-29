import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { propertyName } from '../ast.ts';
import { importedName, QUERY_MODULES } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

const REPLACEMENTS = new Map([
  [
    'Hydrate',
    'HydrationBoundary. It hydrates queries only; use hydrate or persistence for mutations.',
  ],
  ['useHydrate', 'HydrationBoundary for React hydration. Review hydration timing.'],
  ['hashQueryKey', 'hashKey.'],
  ['FetchQueryOptions', 'QueryExecuteOptions. Review generic arguments and select behavior.'],
  [
    'EnsureQueryDataOptions',
    'QueryExecuteOptions with staleTime set to static at the call site. Review background refresh behavior.',
  ],
  ['FetchInfiniteQueryOptions', 'InfiniteQueryExecuteOptions. Review generic arguments.'],
  [
    'EnsureInfiniteQueryDataOptions',
    'InfiniteQueryExecuteOptions with staleTime set to static at the call site. Review background refresh behavior.',
  ],
  [
    'isCancelledError',
    '`error instanceof CancelledError`. Import CancelledError from the same package.',
  ],
  ['isServer', '`environmentManager.isServer()`. Import environmentManager from the same package.'],
]);

export const noDeprecatedImportsName = bnRuleName('no-deprecated-imports');
export const noDeprecatedImports: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow removed exports, deprecated helpers, and deprecated QueryClient option types',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      deprecated: agentDiagnostic({
        problem: '`{{name}}` is deprecated or removed from current TanStack Query.',
        why: 'New code must use the current public API.',
        fix: 'Use {{replacement}}',
        avoid: 'Do not hide the old API behind an alias or re-export.',
      }),
    },
  },
  createOnce(context) {
    function report(node: ESTree.Node, name: string | undefined): void {
      const replacement = name === undefined ? undefined : REPLACEMENTS.get(name);
      if (name !== undefined && replacement !== undefined)
        context.report({ node, messageId: 'deprecated', data: { name, replacement } });
    }
    return {
      before() {
        if (skipFile(context)) return false;
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern' || importedName(context.sourceCode, node.init) !== '*')
          return;
        for (const property of node.id.properties)
          if (property.type === 'Property')
            report(property.key, propertyName(property.key, property.computed));
      },
      ImportDeclaration(node) {
        if (!QUERY_MODULES.has(String(node.source.value))) return;
        for (const specifier of node.specifiers)
          if (specifier.type === 'ImportSpecifier')
            report(specifier, propertyName(specifier.imported));
      },
      ExportNamedDeclaration(node) {
        if (!node.source || !QUERY_MODULES.has(String(node.source.value))) return;
        for (const specifier of node.specifiers) report(specifier, propertyName(specifier.local));
      },
      MemberExpression(node) {
        report(node.property, importedName(context.sourceCode, node));
      },
      TSQualifiedName(node) {
        report(node.right, importedName(context.sourceCode, node));
      },
      JSXMemberExpression(node) {
        report(node.property, importedName(context.sourceCode, node));
      },
    };
  },
});
