import type { ESTree } from '@oxlint/plugins';

import { forEachChild } from '../../lib/ast-node.ts';
import { isFunctionLike, unwrapExpression } from './ast.ts';

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

function expressionDirectlyReturnsJsx(node: ESTree.Expression | null | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (isJsxNode(expression)) {
    return true;
  }
  if (expression.type === 'ConditionalExpression') {
    return (
      expressionDirectlyReturnsJsx(expression.consequent) ||
      expressionDirectlyReturnsJsx(expression.alternate)
    );
  }
  if (expression.type === 'LogicalExpression') {
    return (
      expressionDirectlyReturnsJsx(expression.left) ||
      expressionDirectlyReturnsJsx(expression.right)
    );
  }
  if (expression.type === 'SequenceExpression') {
    return expressionDirectlyReturnsJsx(expression.expressions.at(-1));
  }
  if (expression.type === 'ArrayExpression') {
    return expression.elements.some((element) =>
      element === null ? false : expressionDirectlyReturnsJsx(asExpression(element)),
    );
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
    return expressionDirectlyReturnsJsx(body);
  }

  const visit = (current: ESTree.Node): boolean => {
    if (current.type === 'ReturnStatement') {
      return expressionDirectlyReturnsJsx(current.argument);
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
