import type { CreateOnceRule, ESTree, Variable } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { objectProperty, stableDeclaration, unwrap, variableFor } from '../ast.ts';
import { importedName } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';
import { reactHookName } from '../react.ts';

const QUERIES_HOOKS = new Set(['useQueries', 'useSuspenseQueries']);

const REACT_DEPS_HOOKS = new Set(['useEffect', 'useLayoutEffect', 'useMemo', 'useCallback']);

/** These hooks return a new result object on each render. */
const UNSTABLE_RESULT_HOOKS = new Set([
  'useQuery',
  'useSuspenseQuery',
  'useInfiniteQuery',
  'useSuspenseInfiniteQuery',
  'useQueries',
  'useSuspenseQueries',
  'useMutation',
]);

export const noUnstableDepsName = bnRuleName('no-unstable-deps');
export const noUnstableDeps: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: { description: 'Disallow whole query and mutation results in React hook dependencies' },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      unstable: agentDiagnostic({
        problem:
          'The whole `{{hook}}` result `{{name}}` is in the `{{reactHook}}` dependency list.',
        why: 'The result object is new on each render. The effect or memo then runs on each render.',
        fix: 'Destructure the stable fields and list them: `const { data, mutate } = {{hook}}(...)`, then use `[data, mutate]`.',
        avoid:
          'Do not remove the dependency to silence the warning. Do not wrap the result in `useRef`.',
      }),
    },
  },
  createOnce(context) {
    function resultHook(variable: Variable | undefined, node: ESTree.Node): string | undefined {
      if (variable === undefined) return undefined;
      const declaration = stableDeclaration(context.sourceCode, node);
      if (declaration?.id.type !== 'Identifier') return undefined;
      const init = unwrap(declaration.init);
      if (init?.type !== 'CallExpression') return undefined;
      const name = importedName(context.sourceCode, init.callee);
      if (name === undefined || !UNSTABLE_RESULT_HOOKS.has(name)) return undefined;
      // `combine` output is structurally shared, so it keeps its identity between renders.
      if (
        QUERIES_HOOKS.has(name) &&
        objectProperty(context.sourceCode, init.arguments[0], 'combine')
      )
        return undefined;
      return name;
    }
    return {
      before() {
        if (skipFile(context)) return false;
      },
      CallExpression(node) {
        const reactHook = reactHookName(node, REACT_DEPS_HOOKS);
        if (reactHook === undefined) return;
        const deps = unwrap(node.arguments[1]);
        if (deps?.type !== 'ArrayExpression') return;
        for (const element of deps.elements) {
          const value = unwrap(element);
          if (value?.type !== 'Identifier') continue;
          const hook = resultHook(variableFor(context.sourceCode, value), value);
          if (hook !== undefined)
            context.report({
              node: value,
              messageId: 'unstable',
              data: { hook, name: value.name, reactHook },
            });
        }
      },
    };
  },
});
