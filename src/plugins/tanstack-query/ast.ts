import type { ESTree, SourceCode, Scope, Variable } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';

export function unwrap(node: ESTree.Node | null | undefined): ESTree.Node | undefined {
  if (node == null) return undefined;
  switch (node.type) {
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'TSInstantiationExpression':
    case 'ParenthesizedExpression':
    case 'ChainExpression':
      return unwrap(node.expression);
    default:
      return node;
  }
}

export function propertyName(node: ESTree.Node, computed = false): string | undefined {
  if (!computed && (node.type === 'Identifier' || node.type === 'JSXIdentifier')) return node.name;
  if (node.type === 'Literal' && isJsString(node.value)) return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis[0]?.value.cooked ?? undefined;
  return undefined;
}

export function variableFor(source: SourceCode, node: ESTree.Node): Variable | undefined {
  if (node.type !== 'Identifier' && node.type !== 'JSXIdentifier') return undefined;
  let scope: Scope | null = source.getScope(node);
  while (scope !== null) {
    const variable = scope.set.get(node.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return undefined;
}

export function stableDeclaration(
  source: SourceCode,
  node: ESTree.Node,
): ESTree.VariableDeclarator | undefined {
  const variable = variableFor(source, node);
  if (
    variable === undefined ||
    variable.defs.length !== 1 ||
    variable.references.some((ref) => ref.isWrite() && !ref.init)
  )
    return undefined;
  const definition = variable.defs[0];
  return definition?.type === 'Variable' && definition.node.type === 'VariableDeclarator'
    ? definition.node
    : undefined;
}

export function resolveValue(
  source: SourceCode,
  node: ESTree.Node | null | undefined,
  seen = new Set<ESTree.Node>(),
): ESTree.Node | undefined {
  const value = unwrap(node);
  if (value === undefined || seen.has(value)) return undefined;
  seen.add(value);
  if (value.type !== 'Identifier') return value;
  const variable = variableFor(source, value);
  const definition = variable?.defs.length === 1 ? variable.defs[0] : undefined;
  if (
    definition?.type === 'FunctionName' &&
    definition.node.type === 'FunctionDeclaration' &&
    !variable?.references.some((reference) => reference.isWrite())
  )
    return definition.node;
  const declaration = stableDeclaration(source, value);
  return declaration?.id.type === 'Identifier' && declaration.init != null
    ? resolveValue(source, declaration.init, seen)
    : value;
}

export function objectProperties(
  source: SourceCode,
  node: ESTree.Node | null | undefined,
  seen = new Set<ESTree.Node>(),
): ESTree.ObjectProperty[] {
  const value = resolveValue(source, node);
  if (value?.type !== 'ObjectExpression' || seen.has(value)) return [];
  seen.add(value);
  return value.properties.flatMap((property) =>
    property.type === 'SpreadElement'
      ? objectProperties(source, property.argument, seen)
      : [property],
  );
}

export function objectProperty(
  source: SourceCode,
  node: ESTree.Node | null | undefined,
  name: string,
): ESTree.ObjectProperty | undefined {
  const properties = objectProperties(source, node);
  for (let index = properties.length - 1; index >= 0; index -= 1) {
    const property = properties[index];
    if (property !== undefined && propertyName(property.key, property.computed) === name)
      return property;
  }
  return undefined;
}
