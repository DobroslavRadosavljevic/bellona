import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

type RuntimeFunction = ESTree.ArrowFunctionExpression | ESTree.Function;

function isRuntimeFunction(node: ESTree.Node): node is RuntimeFunction {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}

function isInsideTypeGuard(node: ESTree.Node): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isRuntimeFunction(current)) {
      return current.returnType?.typeAnnotation.type === 'TSTypePredicate';
    }
    current = current.parent;
  }
  return false;
}

/** Disallow runtime typeof checks that narrow unparsed values instead of decoding them. */
export const noRuntimeTypeofName = bnRuleName('no-runtime-typeof');

export const noRuntimeTypeof: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary.',
    },
    messages: {
      runtimeTypeof: agentDiagnostic({
        problem:
          'This `typeof` check narrows a JavaScript representation (`typeof x === "string"` and similar). It does not decode the value into a domain type.',
        why: 'A `typeof` result is not a contract. External input can still be the wrong shape. Callers then branch on a tag instead of a parsed owner type.',
        fix: 'Parse at the I/O boundary with a schema (Zod, Effect Schema, or the project decoder), then branch on the named domain value. If this function is an explicit `x is T` type guard and the project allows it, set `{ allowInTypeGuards: true }` on `bl-js/no-runtime-typeof`.',
        avoid:
          'Do not replace `typeof` with `instanceof`, `in`, or `constructor.name` checks as a workaround. Do not add `as T` after the check. Do not disable the rule to keep the typeof.',
      }),
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowInTypeGuards: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowInTypeGuards: false }],
  },
  createOnce(context) {
    return {
      UnaryExpression(node) {
        const allowInTypeGuards = booleanField(
          objectOptionAt(context, 0),
          'allowInTypeGuards',
          false,
        );
        if (node.operator === 'typeof' && (!allowInTypeGuards || !isInsideTypeGuard(node))) {
          context.report({ node, messageId: 'runtimeTypeof' });
        }
      },
    };
  },
});
