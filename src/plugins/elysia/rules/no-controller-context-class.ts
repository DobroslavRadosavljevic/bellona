import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getParamTypeName, isContextTypeName } from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Disallow class methods typed with Elysia `Context`. Keep controllers
 * decoupled from HTTP context (best-practice).
 */
export const noControllerContextClassName = bnRuleName('elysia', 'no-controller-context-class');

export const noControllerContextClass: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    /** Report class methods whose parameters are typed as Elysia `Context`. */
    const reportIfContextParams = (params: readonly ESTree.Node[], reportNode: ESTree.Node) => {
      for (const param of params) {
        if (isContextTypeName(getParamTypeName(param))) {
          context.report({
            messageId: 'contextClass',
            node: reportNode,
          });
          return;
        }
      }
    };

    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      MethodDefinition(node) {
        if (node.value.type !== 'FunctionExpression') {
          return;
        }
        reportIfContextParams(node.value.params, node.key);
      },
      PropertyDefinition(node) {
        if (
          node.value?.type !== 'ArrowFunctionExpression' &&
          node.value?.type !== 'FunctionExpression'
        ) {
          return;
        }
        reportIfContextParams(node.value.params, node.key);
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow class methods that take Elysia Context; keep controllers decoupled',
    },
    messages: {
      contextClass:
        'Do not type class methods with `Context`. Keep controllers decoupled and destructure handler fields at the Elysia route instead.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
