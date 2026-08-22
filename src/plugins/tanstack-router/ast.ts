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
  node: ESTree.Expression | undefined,
): ESTree.Expression | undefined {
  if (node === undefined) {
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

export function unwrapAssignmentTarget(node: ESTree.AssignmentTarget): ESTree.AssignmentTarget {
  if (
    node.type !== 'TSAsExpression' &&
    node.type !== 'TSSatisfiesExpression' &&
    node.type !== 'TSNonNullExpression' &&
    node.type !== 'TSTypeAssertion'
  ) {
    return node;
  }
  const inner = unwrapExpression(node.expression);
  if (inner === undefined) {
    return node;
  }
  if (
    inner.type === 'Identifier' ||
    inner.type === 'MemberExpression' ||
    inner.type === 'TSAsExpression' ||
    inner.type === 'TSSatisfiesExpression' ||
    inner.type === 'TSNonNullExpression' ||
    inner.type === 'TSTypeAssertion'
  ) {
    return unwrapAssignmentTarget(inner);
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

export function getCallName(node: ESTree.CallExpression): string | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee === undefined) {
    return undefined;
  }
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression') {
    const propertyName = getStaticPropertyName(callee.property);
    if (propertyName === undefined) {
      return undefined;
    }
    const object = unwrapExpression(callee.object);
    if (object?.type === 'Identifier') {
      return `${object.name}.${propertyName}`;
    }
    return propertyName;
  }
  return undefined;
}
