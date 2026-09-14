import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, SourceCode } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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

function hasSafetyComment(sourceCode: SourceCode, node: TypeAssertion, pattern: RegExp): boolean {
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
      missingSafetyComment: agentDiagnostic({
        problem:
          'This type assertion (`as T` or `<T>x`) has no nearby comment that contains `{{marker}}:` (default marker `SAFETY`). `as const` does not need a comment.',
        why: 'An assertion forges a type TypeScript could not prove. Without a stated invariant, later readers cannot tell what was checked.',
        fix: 'Prefer removing the assertion and parsing instead. If the assertion must stay, put a comment on the assertion or its containing statement (`ExpressionStatement`, `VariableDeclaration`, `ReturnStatement`, `ThrowStatement`, `PropertyDefinition`) like `// {{marker}}: UserSchema.parse already validated this JSON`.',
        avoid:
          'Do not add an empty `{{marker}}:` comment. Do not move the comment to an unrelated line. Do not switch to a chained assertion. Do not disable the rule.',
      }),
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
    let marker = 'SAFETY';
    let pattern = /\bSAFETY\s*:/u;

    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node) || hasSafetyComment(context.sourceCode, node, pattern)) return;
      context.report({ node, messageId: 'missingSafetyComment', data: { marker } });
    };

    return {
      before() {
        marker = stringField(objectOptionAt(context, 0), 'marker', 'SAFETY');
        pattern = new RegExp(`\\b${marker.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*:`, 'u');
      },
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
