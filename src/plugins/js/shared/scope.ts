import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';

/** Find the variable that an identifier refers to, from its scope outward. */
export function resolveVariable(
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

/** Reports whether `expression` is the built-in global `name` (not a local binding). */
export function isGlobalIdentifier(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  name: string,
): boolean {
  if (expression.type !== 'Identifier' || expression.name !== name) return false;
  const variable = resolveVariable(sourceCode, expression);
  return variable === null || variable.defs.length === 0;
}

/** Name of a static member property: `a.b` and `a["b"]` give `"b"`. */
export function staticPropertyName(member: ESTree.MemberExpression): string | null {
  if (!member.computed) {
    return member.property.type === 'Identifier' ? member.property.name : null;
  }
  const { property } = member;
  return property.type === 'Literal' && isJsString(property.value) ? property.value : null;
}

/** Reports whether a call is `Object.<method>(…)` on the global `Object`. */
export function isGlobalObjectMethodCall(
  sourceCode: SourceCode,
  node: ESTree.CallExpression,
  methods: ReadonlySet<string>,
): boolean {
  const { callee } = node;
  if (callee.type !== 'MemberExpression') return false;
  const name = staticPropertyName(callee);
  return (
    name !== null && methods.has(name) && isGlobalIdentifier(sourceCode, callee.object, 'Object')
  );
}

/** Remove parentheses around an expression. */
export function unwrapParentheses(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (current.type === 'ParenthesizedExpression') current = current.expression;
  return current;
}
