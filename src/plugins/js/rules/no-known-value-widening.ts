import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  classifyWideningTarget,
  createTypeEnvironment,
  isKnownEvidenceExpression,
  type TypeEnvironment,
  type WideningTarget,
} from '../shared/dictionary-types.ts';

type FunctionExpression = ESTree.ArrowFunctionExpression | ESTree.Function;

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSTypeAssertion' ||
    current.type === 'TSNonNullExpression'
  ) {
    current = current.expression;
  }
  return current;
}

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

function variableDeclarator(variable: Variable): ESTree.VariableDeclarator | null {
  if (variable.defs.length !== 1) return null;
  const [definition] = variable.defs;
  return definition?.type === 'Variable' && definition.node.type === 'VariableDeclarator'
    ? definition.node
    : null;
}

function isStableConstVariable(variable: Variable, declarator: ESTree.VariableDeclarator): boolean {
  return (
    declarator.parent.type === 'VariableDeclaration' &&
    declarator.parent.kind === 'const' &&
    variable.references.every((reference) => reference.init || !reference.isWrite())
  );
}

function hasKnownEvidence(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  visitedVariables = new Set<Variable>(),
): boolean {
  if (isKnownEvidenceExpression(expression)) return true;
  const unwrapped = unwrapExpression(expression);
  if (unwrapped.type !== 'Identifier') return false;
  const variable = resolveVariable(sourceCode, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return false;
  const declarator = variableDeclarator(variable);
  if (
    declarator === null ||
    declarator.init === null ||
    !isStableConstVariable(variable, declarator)
  ) {
    return false;
  }
  visitedVariables.add(variable);
  return hasKnownEvidence(sourceCode, declarator.init, visitedVariables);
}

function annotationTarget(
  annotation: ESTree.TSTypeAnnotation | null | undefined,
  environment: TypeEnvironment,
): WideningTarget | null {
  return annotation === null || annotation === undefined
    ? null
    : classifyWideningTarget(annotation.typeAnnotation, environment);
}

function enclosingFunction(node: ESTree.Node): FunctionExpression | null {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression'
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function sourceKeyName(sourceCode: SourceCode, key: ESTree.PropertyKey): string {
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') return key.name;
  if (key.type === 'Literal') return String(key.value);
  return sourceCode.getText(key);
}

function functionName(sourceCode: SourceCode, owner: FunctionExpression | null): string {
  if (owner === null) return 'anonymous function';
  if (owner.id !== null) return owner.id.name;
  const parent = owner.parent;
  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier')
    return parent.id.name;
  if (parent.type === 'MethodDefinition') return sourceKeyName(sourceCode, parent.key);
  return 'anonymous function';
}

function isEmptyObjectExpression(expression: ESTree.Expression): boolean {
  const unwrapped = unwrapExpression(expression);
  return unwrapped.type === 'ObjectExpression' && unwrapped.properties.length === 0;
}

function isDictionaryAccumulatorTarget(destination: WideningTarget): boolean {
  return destination.kind === 'open dictionary' || destination.kind === 'generic container';
}

function isStaticKey(key: ESTree.Expression): boolean {
  return key.type === 'Literal' || (key.type === 'TemplateLiteral' && key.expressions.length === 0);
}

/**
 * `const prices: Record<string, Price> = { … }` followed by `prices[id]` needs
 * the dictionary type: with the inferred closed type, a runtime `string` key
 * is a compile error (TS7053). Keep the annotation when this file reads or
 * writes the binding by a runtime key.
 * @see https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures
 */
function isIndexedByRuntimeKey(variable: Variable): boolean {
  return variable.references.some((reference) => {
    const { identifier } = reference;
    const parent = identifier.parent;
    return (
      parent?.type === 'MemberExpression' &&
      parent.object === identifier &&
      parent.computed &&
      !isStaticKey(parent.property)
    );
  });
}

function declaredVariable(
  sourceCode: SourceCode,
  declarator: ESTree.VariableDeclarator,
): Variable | null {
  if (declarator.id.type !== 'Identifier') return null;
  const name = declarator.id.name;
  return sourceCode.getDeclaredVariables(declarator).find((entry) => entry.name === name) ?? null;
}

function hasParentAssertion(node: ESTree.Node): boolean {
  return node.parent?.type === 'TSAsExpression' || node.parent?.type === 'TSTypeAssertion';
}

/** Detect sound syntactic cases where a known value is explicitly widened and loses evidence. */
export const noKnownValueWideningName = bnRuleName('no-known-value-widening');

export const noKnownValueWidening: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.',
    },
    messages: {
      widening: agentDiagnostic({
        problem:
          'The explicit {{target}} type on {{subject}} widens a value whose type is already known from the expression (literal, constructor, or other evidence in this file).',
        why: 'A broad annotation (`unknown`, `object`, a dictionary with `string` keys, a generic dictionary alias) throws away that evidence, such as the key names. Later code must guess or assert.',
        fix: 'Remove the annotation and keep inference, or write `const x = value satisfies NamedType`, or annotate with a named owner type that matches the value. Parse untrusted input at the boundary into that named type. A dictionary type stays allowed when this file reads or writes the binding by a runtime key (`table[key]`); for other modules, export a lookup function from this file.',
        avoid:
          'Do not assert `as NamedType` after widening. Do not replace the annotation with `any`. Do not wrap the value in a redundant cast. Do not disable the rule.',
      }),
      anonymousObject: agentDiagnostic({
        problem:
          'The inline object type on {{subject}} repeats the type that TypeScript already infers from the value. The type has no owner name.',
        why: 'An inline object type does not keep more evidence than inference. Other code cannot import it, so each use copies the fields, and the copies can drift apart.',
        fix: 'Remove the annotation and keep inference, or write `value satisfies NamedType`, or move the fields into a named type and use that name here.',
        avoid:
          'Do not replace the annotation with `object`, `unknown`, or `any`. Do not assert `as NamedType`. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    let environment: TypeEnvironment | null = null;

    const reportFlow = (
      expression: ESTree.Expression,
      destination: WideningTarget | null,
      subject: string,
      binding: Variable | null = null,
    ) => {
      if (destination === null) return;
      if (
        isDictionaryAccumulatorTarget(destination) &&
        (isEmptyObjectExpression(expression) ||
          (binding !== null && isIndexedByRuntimeKey(binding)))
      ) {
        return;
      }
      if (!hasKnownEvidence(context.sourceCode, expression)) return;
      context.report({
        node: expression,
        messageId: destination.kind === 'anonymous object' ? 'anonymousObject' : 'widening',
        data: { subject, target: destination.kind },
      });
    };

    const targetFromAnnotation = (annotation: ESTree.TSTypeAnnotation | null | undefined) =>
      environment === null ? null : annotationTarget(annotation, environment);

    return {
      Program(node) {
        environment = createTypeEnvironment(node);
      },
      VariableDeclarator(node) {
        if (node.init === null || node.id.type !== 'Identifier') return;
        const destination = targetFromAnnotation(node.id.typeAnnotation);
        if (destination === null) return;
        reportFlow(
          node.init,
          destination,
          `binding \`${node.id.name}\``,
          declaredVariable(context.sourceCode, node),
        );
      },
      PropertyDefinition(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        );
      },
      AccessorProperty(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        );
      },
      AssignmentExpression(node) {
        if (node.operator !== '=' || node.left.type !== 'Identifier') return;
        const variable = resolveVariable(context.sourceCode, node.left);
        if (variable === null) return;
        const declarator = variableDeclarator(variable);
        if (declarator === null || declarator.id.type !== 'Identifier') return;
        reportFlow(
          node.right,
          targetFromAnnotation(declarator.id.typeAnnotation),
          `binding \`${declarator.id.name}\``,
          variable,
        );
      },
      ReturnStatement(node) {
        if (node.argument === null) return;
        const owner = enclosingFunction(node);
        reportFlow(
          node.argument,
          targetFromAnnotation(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``,
        );
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === 'BlockStatement') return;
        reportFlow(
          node.body,
          targetFromAnnotation(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``,
        );
      },
      TSAsExpression(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          'assertion',
        );
      },
      TSTypeAssertion(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          'assertion',
        );
      },
    };
  },
});
