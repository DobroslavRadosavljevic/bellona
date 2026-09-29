import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectElysiaContextBindings,
  type ElysiaContextBindings,
  isElysiaContextParam,
} from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

const isClassBodyMethod = (node: ESTree.Node): boolean => {
  const { parent } = node;
  return parent?.type === 'MethodDefinition' || parent?.type === 'PropertyDefinition';
};

/**
 * Disallow typing parameters as Elysia `Context`: destructure what you need
 * instead of passing the whole context (Elysia best practice). Functions report
 * each parameter (`contextParam`). Class methods and class fields report once
 * on the member key (`contextClass`), so controllers stay free of HTTP types.
 */
export const noContextParamName = bnRuleName('no-context-param');

export const noContextParam: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    let bindings: ElysiaContextBindings | undefined = undefined;

    /** Report handler parameters typed as Elysia `Context`. */
    const reportContextParams = (params: readonly ESTree.Node[]) => {
      for (const param of params) {
        if (bindings && isElysiaContextParam(param, bindings)) {
          context.report({
            messageId: 'contextParam',
            node: param,
          });
        }
      }
    };

    /** Report a class member once when any parameter is typed as Elysia `Context`. */
    const reportClassMember = (params: readonly ESTree.Node[], reportNode: ESTree.Node) => {
      if (bindings && params.some((param) => bindings && isElysiaContextParam(param, bindings))) {
        context.report({ messageId: 'contextClass', node: reportNode });
      }
    };

    return {
      before() {
        bindings = undefined;
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
        bindings = collectElysiaContextBindings(context.sourceCode.ast);
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
      MethodDefinition(node) {
        if (node.value.type !== 'FunctionExpression') {
          return;
        }
        reportClassMember(node.value.params, node.key);
      },
      PropertyDefinition(node) {
        if (
          node.value?.type !== 'ArrowFunctionExpression' &&
          node.value?.type !== 'FunctionExpression'
        ) {
          return;
        }
        reportClassMember(node.value.params, node.key);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow typing function and class method parameters as Elysia Context; destructure needed fields',
    },
    messages: {
      contextParam: agentDiagnostic({
        problem:
          'A handler (or similar) parameter is typed as Elysia `Context`. That type is the whole request bag.',
        why: 'Typing `Context` couples the function to HTTP and hides which fields it actually reads. Tests then need a fake full context.',
        fix: 'Destructure the fields you use from the handler argument: `({ body, params, status }) => { … }`. Type those fields, not `Context`.',
        avoid: 'Do not alias `Context` as `Ctx`. Do not disable the rule.',
      }),
      contextClass: agentDiagnostic({
        problem:
          'A class method is typed with Elysia `Context`. Controllers then depend on the HTTP layer.',
        why: 'Domain classes should not know about Elysia request objects. That makes reuse and tests depend on the framework.',
        fix: 'Keep the class free of `Context`. Destructure `{ body, params, status }` at the Elysia route and pass named values into the class.',
        avoid: 'Do not store `Context` on `this`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
