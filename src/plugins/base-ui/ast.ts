import type { ESTree } from '@oxlint/plugins';

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

export function asExpression(node: ESTree.Node | null | undefined): ESTree.Expression | undefined {
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
