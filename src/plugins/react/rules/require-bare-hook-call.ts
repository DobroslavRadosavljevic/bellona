import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isBareHookCall, isHookCall } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipReactFile } from '../options.ts';

export const requireBareHookCallName = bnRuleName('require-bare-hook-call');

export const requireBareHookCall: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a React hook call to be the whole assignment, return, or a standalone statement',
    },
    messages: {
      notBare: agentDiagnostic({
        problem:
          'This React hook call has extra syntax after it (member access, `?.`, `??`, a call, or a type assertion).',
        why: 'The hook return is the value to keep. Extra syntax after `useX()` hides null, arrays, and types in the call site.',
        fix: 'Write `const tags = useSomethingTags();` then handle null or array in the next lines. `return useFoo()` is allowed.',
        avoid:
          'Do not write `useSomethingTags()?.tags`. Do not write `useSomethingTags().tags` or `useSomethingTags() ?? []`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipReactFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (!isHookCall(node) || isBareHookCall(node)) {
          return;
        }
        context.report({ messageId: 'notBare', node });
      },
    };
  },
});
