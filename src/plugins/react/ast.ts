import type { ESTree } from '@oxlint/plugins';

import { isJsNumber, isJsString } from '../../lib/js-kind.ts';

function isTsExpressionWrapper(
  node: ESTree.Node,
): node is
  | ESTree.TSAsExpression
  | ESTree.TSSatisfiesExpression
  | ESTree.TSNonNullExpression
  | ESTree.TSTypeAssertion
  | ESTree.TSInstantiationExpression {
  return (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSInstantiationExpression'
  );
}

export function unwrapExpression(
  node: ESTree.Expression | null | undefined,
): ESTree.Expression | undefined {
  if (node === undefined || node === null) {
    return undefined;
  }
  if (node.type === 'ParenthesizedExpression') {
    return unwrapExpression(node.expression);
  }
  if (node.type === 'ChainExpression') {
    return unwrapExpression(node.expression);
  }
  if (isTsExpressionWrapper(node)) {
    return unwrapExpression(node.expression);
  }
  return node;
}

export function getStaticPropertyName(node: ESTree.Node): string | undefined {
  if (node.type === 'Identifier' || node.type === 'PrivateIdentifier') {
    return node.name;
  }
  if (node.type === 'Literal') {
    if (isJsString(node.value)) {
      return node.value;
    }
    if (isJsNumber(node.value)) {
      return String(node.value);
    }
  }
  return undefined;
}

export function isFunctionLike(
  node: ESTree.Node | null | undefined,
): node is ESTree.Function | ESTree.ArrowFunctionExpression {
  return (
    node !== undefined &&
    node !== null &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression' ||
      node.type === 'FunctionDeclaration')
  );
}

export function getEnclosingFunctionName(node: ESTree.Node): string | undefined {
  let current: ESTree.Node | undefined = node.parent ?? undefined;

  while (current) {
    if (current.type === 'FunctionDeclaration') {
      return current.id?.name;
    }

    if (
      (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') &&
      current.parent.type === 'VariableDeclarator' &&
      current.parent.id.type === 'Identifier'
    ) {
      return current.parent.id.name;
    }

    current = current.parent ?? undefined;
  }

  return undefined;
}

export function isAtModuleScope(node: ESTree.Node): boolean {
  let current: ESTree.Node | undefined = node.parent ?? undefined;

  while (current) {
    if (isFunctionLike(current)) {
      return false;
    }
    current = current.parent ?? undefined;
  }

  return true;
}

export function isModuleLevelDeclaration(node: ESTree.Node): boolean {
  return getEnclosingFunctionName(node) === undefined;
}
