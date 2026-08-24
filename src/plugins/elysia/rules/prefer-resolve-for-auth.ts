import type { CreateOnceRule } from '@oxlint/plugins';

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
export const preferResolveForAuthName = bnRuleName('elysia', 'prefer-resolve-for-auth');

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
      preferResolve:
        'Prefer `.resolve` or a macro for auth/session context: avoid `.derive` for cookie / Authorization / user/session.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
