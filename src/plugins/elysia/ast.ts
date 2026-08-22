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

export function unwrapExpression(node: ESTree.Node | null | undefined): ESTree.Node | undefined {
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
  if (node.type === 'SpreadElement' || node.type === 'JSXEmptyExpression') {
    return undefined;
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
