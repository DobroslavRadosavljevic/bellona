import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { propertyName, stableDeclaration, unwrap } from '../ast.ts';
import { resultKind } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

function replacement(name: string, kind: 'query' | 'mutation'): string | undefined {
  if (kind === 'mutation') return name === 'isLoading' ? 'isPending' : undefined;
  if (name === 'isInitialLoading') return 'isLoading';
  if (name === 'isPreviousData') return 'isPlaceholderData; review placeholder status behavior';
  if (name === 'remove') return 'queryClient.removeQueries({ queryKey })';
  return undefined;
}

export const noDeprecatedResultsName = bnRuleName('no-deprecated-results');
export const noDeprecatedResults: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: { description: 'Disallow deprecated result fields and loading status checks' },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      deprecated: agentDiagnostic({
        problem: '`{{name}}` is a deprecated or removed query result value.',
        why: 'Current query and mutation results use different names.',
        fix: 'Use {{replacement}}.',
        avoid: 'Do not rename query isLoading. It remains a valid query result field.',
      }),
    },
  },
  createOnce(context) {
    function report(node: ESTree.Node, name: string, change: string): void {
      context.report({ node, messageId: 'deprecated', data: { name, replacement: change } });
    }
    function isStatus(node: ESTree.Node): boolean {
      const value = unwrap(node);
      if (value?.type === 'MemberExpression')
        return (
          propertyName(value.property, value.computed) === 'status' &&
          resultKind(context.sourceCode, value.object) !== undefined
        );
      if (value?.type !== 'Identifier') return false;
      const declaration = stableDeclaration(context.sourceCode, value);
      if (
        declaration?.id.type !== 'ObjectPattern' ||
        resultKind(context.sourceCode, declaration.init) === undefined
      )
        return false;
      return declaration.id.properties.some(
        (property) =>
          property.type === 'Property' &&
          propertyName(property.key, property.computed) === 'status' &&
          property.value.type === 'Identifier' &&
          property.value.name === value.name,
      );
    }
    return {
      before() {
        if (skipFile(context)) return false;
      },
      MemberExpression(node) {
        const kind = resultKind(context.sourceCode, node.object);
        const name = propertyName(node.property, node.computed);
        const change =
          kind === undefined || name === undefined ? undefined : replacement(name, kind);
        if (name !== undefined && change !== undefined) report(node.property, name, change);
      },
      VariableDeclarator(node) {
        const kind = resultKind(context.sourceCode, node.init);
        if (kind === undefined || node.id.type !== 'ObjectPattern') return;
        for (const property of node.id.properties) {
          if (property.type !== 'Property') continue;
          const name = propertyName(property.key, property.computed);
          const change = name === undefined ? undefined : replacement(name, kind);
          if (name !== undefined && change !== undefined) report(property.key, name, change);
        }
      },
      BinaryExpression(node) {
        if (!['===', '!==', '==', '!='].includes(node.operator)) return;
        for (const [status, literal] of [
          [node.left, node.right],
          [node.right, node.left],
        ]) {
          if (
            status === undefined ||
            literal?.type !== 'Literal' ||
            literal.value !== 'loading' ||
            !isStatus(status)
          )
            continue;
          report(literal, 'loading', 'pending');
        }
      },
      SwitchCase(node) {
        if (
          node.test?.type === 'Literal' &&
          node.test.value === 'loading' &&
          node.parent.type === 'SwitchStatement' &&
          isStatus(node.parent.discriminant)
        )
          report(node.test, 'loading', 'pending');
      },
    };
  },
});
