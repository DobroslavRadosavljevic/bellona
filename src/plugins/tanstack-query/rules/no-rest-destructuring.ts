import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { propertyName, unwrap } from '../ast.ts';
import { importedName, resultKind } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

const QUERIES_HOOKS = new Set(['useQueries', 'useSuspenseQueries']);

function restElement(pattern: ESTree.Node | null | undefined): ESTree.Node | undefined {
  const value = pattern?.type === 'AssignmentPattern' ? pattern.left : pattern;
  if (value?.type !== 'ObjectPattern') return undefined;
  return value.properties.find((property) => property.type === 'RestElement');
}

export const noRestDestructuringName = bnRuleName('no-rest-destructuring');
export const noRestDestructuring: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: { description: 'Disallow rest destructuring of query results' },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      rest: agentDiagnostic({
        problem: 'A query result is destructured with a rest element (`...rest`).',
        why: 'Query tracks the result fields that a component reads and renders again only when they change. A rest element reads every field, so the component renders again on each change.',
        fix: 'Destructure only the fields that you use: `const { data, isPending } = useQuery(options)`. Or keep the result object and read fields from it.',
        avoid: 'Do not spread the result into props. Do not set `notifyOnChangeProps: "all"`.',
      }),
    },
  },
  createOnce(context) {
    function isQueriesCall(node: ESTree.Node | null | undefined): boolean {
      const value = unwrap(node);
      return (
        value?.type === 'CallExpression' &&
        QUERIES_HOOKS.has(importedName(context.sourceCode, value.callee) ?? '')
      );
    }
    return {
      before() {
        if (skipFile(context)) return false;
      },
      VariableDeclarator(node) {
        if (resultKind(context.sourceCode, node.init) === 'query') {
          const rest = restElement(node.id);
          if (rest !== undefined) context.report({ node: rest, messageId: 'rest' });
          return;
        }
        if (node.id.type !== 'ArrayPattern' || !isQueriesCall(node.init)) return;
        for (const element of node.id.elements) {
          const rest = restElement(element);
          if (rest !== undefined) context.report({ node: rest, messageId: 'rest' });
        }
      },
      CallExpression(node) {
        // useQueries(...).map(({ data, ...rest }) => ...)
        const callee = unwrap(node.callee);
        if (
          callee?.type !== 'MemberExpression' ||
          !['map', 'forEach', 'filter', 'find', 'some', 'every', 'flatMap'].includes(
            propertyName(callee.property, callee.computed) ?? '',
          ) ||
          !isQueriesCall(callee.object)
        )
          return;
        const callback = unwrap(node.arguments[0]);
        if (callback?.type !== 'ArrowFunctionExpression' && callback?.type !== 'FunctionExpression')
          return;
        const rest = restElement(callback.params[0]);
        if (rest !== undefined) context.report({ node: rest, messageId: 'rest' });
      },
    };
  },
});
