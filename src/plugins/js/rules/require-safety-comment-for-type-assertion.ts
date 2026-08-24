import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, SourceCode } from '@oxlint/plugins';

import { objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

const commentOwnerKinds = new Set([
  'ExpressionStatement',
  'PropertyDefinition',
  'ReturnStatement',
  'ThrowStatement',
  'VariableDeclaration',
]);

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === 'TSTypeReference' &&
    node.typeAnnotation.typeName.type === 'Identifier' &&
    node.typeAnnotation.typeName.name === 'const'
  );
}

function hasSafetyComment(sourceCode: SourceCode, node: TypeAssertion, marker: string): boolean {
  const pattern = new RegExp(`\\b${marker.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*:`, 'u');
  let current: ESTree.Node = node;
  while (true) {
    if (
      sourceCode
        .getCommentsBefore(current)
        .some((comment) => comment.end <= node.start && pattern.test(comment.value))
    ) {
      return true;
    }
    if (commentOwnerKinds.has(current.type) || current.parent.type === 'Program') return false;
    current = current.parent;
  }
}

/** Require every non-const type assertion to state the invariant TypeScript cannot express. */
export const requireSafetyCommentForTypeAssertionName = bnRuleName(
  'js',
  'require-safety-comment-for-type-assertion',
);

export const requireSafetyCommentForTypeAssertion: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.',
    },
    messages: {
      missingSafetyComment:
        'This type assertion has no `{{marker}}:` justification. State the checked invariant immediately before the assertion or its containing statement.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          marker: { type: 'string' },
        },
      },
    ],
    defaultOptions: [{ marker: 'SAFETY' }],
  },
  createOnce(context) {
    const checkAssertion = (node: TypeAssertion) => {
      const marker = stringField(objectOptionAt(context, 0), 'marker', 'SAFETY');
      if (isConstAssertion(node) || hasSafetyComment(context.sourceCode, node, marker)) return;
      context.report({ node, messageId: 'missingSafetyComment', data: { marker } });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
