import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getElysiaDeriveCallback, isAuthRelatedDeriveCallback } from '../elysia.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipElysiaPluginDir,
} from '../options.ts';

/**
 * Prefer `.resolve` / macros over `.derive` for session/auth context in
 * plugin files. IP-only derives are allowed.
 */
export const preferResolveForAuthName = bnRuleName('prefer-resolve-for-auth');

export const preferResolveForAuth: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaPluginDir(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callback = getElysiaDeriveCallback(node);
        if (!callback || !isAuthRelatedDeriveCallback(callback)) {
          return;
        }
        context.report({ messageId: 'preferResolve', node: callback });
      },
    };
  },
  meta: {
    docs: {
      description: 'Prefer .resolve / macros over .derive for auth/session in plugins',
    },
    messages: {
      preferResolve: agentDiagnostic({
        problem:
          'This `/plugins/` Elysia plugin uses `.derive` for cookie / `Authorization` / user / session. Auth context belongs on `.resolve` (or a macro).',
        why: '`.derive` runs more often and is the wrong slot for request auth. `.resolve` is the documented place for derived request context such as the user.',
        fix: 'Move the auth/session logic to `.resolve(({ cookie, headers }) => ({ user }))` or a macro. Stop using `.derive` for those fields.',
        avoid: 'Do not keep `.derive` and also add `.resolve`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
