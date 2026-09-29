import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, isAllowedFile } from '../options.ts';
import {
  isGlobalObjectMethodCall,
  staticPropertyName,
  unwrapParentheses,
} from '../shared/scope.ts';

const keyMethods: ReadonlySet<string> = new Set(['entries', 'keys']);

/** Ban assertions that turn `Object.keys` / `Object.entries` string keys into `keyof T`. */
export const noObjectKeysAssertionName = bnRuleName('no-object-keys-assertion');

export const noObjectKeysAssertion: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow type assertions on Object.keys and Object.entries results; object types can hold more keys than they list.',
    },
    messages: {
      keysAssertion: agentDiagnostic({
        problem:
          'This code asserts the result of `Object.{{method}}(…)` to a narrower type (for example `as (keyof T)[]`).',
        why: 'TypeScript types `Object.{{method}}` with `string` keys on purpose. An object type is open: a value can have more own keys than its type lists, so the assertion claims keys that nothing checked.',
        fix: 'Loop over a list of the known keys that you declare, for example `const fields = ["id", "name"] as const`. Or keep the `string` key and read each value with a checked lookup (`Object.hasOwn(value, key)`).',
        avoid:
          'Do not move the assertion into a helper such as `typedKeys()`. Do not chain `as unknown as`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const check = (node: ESTree.TSAsExpression | ESTree.TSTypeAssertion) => {
      const expression = unwrapParentheses(node.expression);
      if (
        expression.type !== 'CallExpression' ||
        !isGlobalObjectMethodCall(context.sourceCode, expression, keyMethods) ||
        expression.callee.type !== 'MemberExpression'
      ) {
        return;
      }
      const method = staticPropertyName(expression.callee) ?? 'keys';
      context.report({ node, messageId: 'keysAssertion', data: { method } });
    };

    return {
      before() {
        if (isAllowedFile(context)) return false;
      },
      TSAsExpression: check,
      TSTypeAssertion: check,
    };
  },
});
