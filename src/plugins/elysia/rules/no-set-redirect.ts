import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Disallow `set.redirect = url`. Elysia 1.4 marks `set.redirect` `@deprecated`
 * ("Use inline redirect instead", `dist/context.d.ts`). Return `redirect(url)`.
 */
export const noSetRedirectName = bnRuleName('no-set-redirect');

export const noSetRedirect: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      AssignmentExpression(node) {
        const left = unwrapExpression(node.left);
        if (
          left?.type !== 'MemberExpression' ||
          getStaticPropertyName(left.property) !== 'redirect'
        ) {
          return;
        }
        if (left.computed && left.property.type !== 'Literal') {
          return;
        }
        const object = unwrapExpression(left.object);
        const isSet =
          (object?.type === 'Identifier' && object.name === 'set') ||
          (object?.type === 'MemberExpression' &&
            !object.computed &&
            getStaticPropertyName(object.property) === 'set');
        if (!isSet) {
          return;
        }
        context.report({ messageId: 'setRedirect', node });
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow deprecated set.redirect = url; return redirect(url) instead',
    },
    messages: {
      setRedirect: agentDiagnostic({
        problem: 'This code assigns `set.redirect`. Elysia 1.4 marks `set.redirect` `@deprecated`.',
        why: 'The Elysia context type says to use the inline `redirect` instead. `redirect()` returns the redirect response, so the handler shows its result in one place.',
        fix: 'Return the redirect from the handler: `({ redirect }) => redirect("/login")` or `redirect("/login", 303)` (status `301` / `302` / `303` / `307` / `308`).',
        avoid:
          'Do not set `set.status = 302` and a `Location` header by hand. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
