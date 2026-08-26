import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getParamTypeName, isContextTypeName } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

const isClassBodyMethod = (node: ESTree.Node): boolean => {
  const { parent } = node;
  return parent?.type === 'MethodDefinition' || parent?.type === 'PropertyDefinition';
};

/**
 * Disallow typing handler parameters as Elysia `Context`: destructure what
 * you need instead of passing the whole context (best-practice).
 *
 * Class methods are covered by `no-controller-context-class`.
 */
export const noContextParamName = bnRuleName('no-context-param');

export const noContextParam: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    /** Report handler parameters typed as Elysia `Context`. */
    const reportContextParams = (params: readonly ESTree.Node[]) => {
      for (const param of params) {
        if (isContextTypeName(getParamTypeName(param))) {
          context.report({
            messageId: 'contextParam',
            node: param,
          });
        }
      }
    };

    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        reportContextParams(node.params);
      },
      FunctionExpression(node) {
        if (isClassBodyMethod(node)) {
          return;
        }
        reportContextParams(node.params);
      },
      ArrowFunctionExpression(node) {
        if (isClassBodyMethod(node)) {
          return;
        }
        reportContextParams(node.params);
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow typing parameters as Elysia Context; destructure needed fields',
    },
    messages: {
      contextParam: agentDiagnostic({
        problem:
          'A handler (or similar) parameter is typed as Elysia `Context`. That type is the whole request bag.',
        why: 'Typing `Context` couples the function to HTTP and hides which fields it actually reads. Tests then need a fake full context.',
        fix: 'Destructure the fields you use from the handler argument: `({ body, params, status }) => { … }`. Type those fields, not `Context`.',
        avoid: 'Do not alias `Context` as `Ctx`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
