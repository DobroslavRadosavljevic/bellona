import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, SourceCode } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

const classFieldKinds: ReadonlySet<string> = new Set(['AccessorProperty', 'PropertyDefinition']);

/**
 * The comment owner is the nearest statement, declaration, or class field.
 * A comment above an enclosing `function` or `if` block does not describe an
 * assertion deep inside it.
 */
function isCommentOwner(node: ESTree.Node): boolean {
  return (
    node.type.endsWith('Statement') ||
    node.type.endsWith('Declaration') ||
    classFieldKinds.has(node.type)
  );
}

function hasMarkerBefore(
  sourceCode: SourceCode,
  node: ESTree.Node,
  assertion: TypeAssertion,
  pattern: RegExp,
): boolean {
  return sourceCode
    .getCommentsBefore(node)
    .some((comment) => comment.end <= assertion.start && pattern.test(comment.value));
}

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
    if (hasMarkerBefore(sourceCode, current, node, pattern)) return true;
    if (isCommentOwner(current)) {
      // `// SAFETY: …` above `export const x = y as T` sits before the export.
      const { parent } = current;
      return (
        (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration') &&
        hasMarkerBefore(sourceCode, parent, node, pattern)
      );
    }
    if (current.parent.type === 'Program') return false;
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
        fix: 'Prefer removing the assertion and parsing instead. If the assertion must stay, put a comment on the assertion or on the nearest statement or class field that contains it (an `export` in front also counts), like `// {{marker}}: UserSchema.parse already validated this JSON`.',
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
