import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { unwrap } from '../ast.ts';
import { importedName } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';
import { enclosingFunction, isComponentOrHook, reactHookName } from '../react.ts';

/** Hooks whose first argument keeps the first value for the component's lifetime. */
const STABLE_INITIALIZERS = new Set(['useState', 'useRef']);

/** `useState(new QueryClient())`: the hook keeps the first client. */
function isStableInitializerArgument(node: ESTree.NewExpression): boolean {
  let current: ESTree.Node = node;
  while (current.parent != null && unwrap(current.parent) !== current.parent) {
    current = current.parent;
  }
  const parent = current.parent ?? undefined;
  return (
    parent?.type === 'CallExpression' &&
    parent.arguments[0] === current &&
    reactHookName(parent, STABLE_INITIALIZERS) !== undefined
  );
}

export const stableQueryClientName = bnRuleName('stable-query-client');
export const stableQueryClient: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow a new QueryClient on each render of a component or hook',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      unstable: agentDiagnostic({
        problem: '`new QueryClient()` runs in the body of a component or hook.',
        why: 'Each render makes a new client with an empty cache. Queries then fetch again and lose their data.',
        fix: 'Make the client once: `const [queryClient] = useState(() => new QueryClient())`, or create it at module level outside the component.',
        avoid:
          'Do not move the call into `useEffect`. Do not store the client in a plain variable in the component.',
      }),
    },
  },
  createOnce(context) {
    return {
      before() {
        if (skipFile(context)) return false;
      },
      NewExpression(node) {
        if (importedName(context.sourceCode, node.callee) !== 'QueryClient') return;
        const fn = enclosingFunction(node);
        // Async server components make one client per request, like the official rule allows.
        if (fn === undefined || fn.async || !isComponentOrHook(fn)) return;
        if (isStableInitializerArgument(node)) return;
        context.report({ node, messageId: 'unstable' });
      },
    };
  },
});
