import type { ESTree } from '@oxlint/plugins';

import { forEachChild } from '../../lib/ast-node.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from './ast.ts';

type VisitorKeys = Readonly<Record<string, readonly string[]>>;

function isJsxNode(node: ESTree.Node | undefined): node is ESTree.JSXElement | ESTree.JSXFragment {
  return node !== undefined && (node.type === 'JSXElement' || node.type === 'JSXFragment');
}

function asExpression(node: ESTree.Node | null | undefined): ESTree.Expression | undefined {
  if (node === undefined || node === null) {
    return undefined;
  }
  switch (node.type) {
    case 'Literal':
    case 'ThisExpression':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'ClassExpression':
    case 'TaggedTemplateExpression':
    case 'TemplateLiteral':
    case 'MemberExpression':
    case 'CallExpression':
    case 'NewExpression':
    case 'ChainExpression':
    case 'ImportExpression':
    case 'UnaryExpression':
    case 'UpdateExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'ConditionalExpression':
    case 'AssignmentExpression':
    case 'SequenceExpression':
    case 'YieldExpression':
    case 'AwaitExpression':
    case 'ParenthesizedExpression':
    case 'JSXElement':
    case 'JSXFragment':
    case 'MetaProperty':
      return node;
    default:
      return undefined;
  }
}

function isListMapperName(name: string | undefined): boolean {
  return name === 'map' || name === 'flatMap';
}

function isJsxMappedListCall(node: ESTree.Expression, visitorKeys: VisitorKeys): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  if (callee === undefined || callee.type !== 'MemberExpression') {
    return false;
  }
  if (!isListMapperName(getStaticPropertyName(callee.property))) {
    return false;
  }
  for (const argument of node.arguments) {
    if (argument.type === 'SpreadElement') {
      continue;
    }
    const callback = unwrapExpression(argument);
    if (isFunctionLike(callback) && functionReturnsJsx(callback, visitorKeys)) {
      return true;
    }
  }
  return false;
}

export function expressionContainsJsx(
  node: ESTree.Expression | null | undefined,
  visitorKeys: VisitorKeys,
): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (isJsxNode(expression)) {
    return true;
  }
  if (isFunctionLike(expression)) {
    return false;
  }
  if (isJsxMappedListCall(expression, visitorKeys)) {
    return true;
  }

  const keys = visitorKeys[expression.type] ?? [];
  let found = false;
  forEachChild(expression, keys, (child) => {
    if (found) {
      return;
    }
    if (expressionContainsJsx(asExpression(child), visitorKeys)) {
      found = true;
    }
  });
  return found;
}

function expressionDirectlyReturnsJsx(
  node: ESTree.Expression | null | undefined,
  visitorKeys: VisitorKeys,
): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (isJsxNode(expression)) {
    return true;
  }
  if (expression.type === 'ConditionalExpression') {
    return (
      expressionDirectlyReturnsJsx(expression.consequent, visitorKeys) ||
      expressionDirectlyReturnsJsx(expression.alternate, visitorKeys)
    );
  }
  if (expression.type === 'LogicalExpression') {
    return (
      expressionDirectlyReturnsJsx(expression.left, visitorKeys) ||
      expressionDirectlyReturnsJsx(expression.right, visitorKeys)
    );
  }
  if (expression.type === 'SequenceExpression') {
    return expressionDirectlyReturnsJsx(expression.expressions.at(-1), visitorKeys);
  }
  if (expression.type === 'ArrayExpression') {
    return expression.elements.some((element) =>
      element === null ? false : expressionDirectlyReturnsJsx(asExpression(element), visitorKeys),
    );
  }
  if (isJsxMappedListCall(expression, visitorKeys)) {
    return true;
  }
  if (expression.type === 'CallExpression') {
    const callee = unwrapExpression(expression.callee);
    if (isFunctionLike(callee)) {
      return functionReturnsJsx(callee, visitorKeys);
    }
  }
  return false;
}

export function functionReturnsJsx(
  node: ESTree.Function | ESTree.ArrowFunctionExpression,
  visitorKeys: VisitorKeys,
): boolean {
  const { body } = node;
  if (body === null || body === undefined) {
    return false;
  }
  if (body.type !== 'BlockStatement') {
    return expressionDirectlyReturnsJsx(body, visitorKeys);
  }

  const visit = (current: ESTree.Node): boolean => {
    if (current.type === 'ReturnStatement') {
      return expressionDirectlyReturnsJsx(current.argument, visitorKeys);
    }
    if (current !== body && isFunctionLike(current)) {
      return false;
    }

    const keys = visitorKeys[current.type] ?? [];
    let found = false;
    forEachChild(current, keys, (child) => {
      if (found) {
        return;
      }
      if (visit(child)) {
        found = true;
      }
    });
    return found;
  };

  return visit(body);
}
