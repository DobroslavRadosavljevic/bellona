import type { ESTree } from '@oxlint/plugins';

import { isJsNumber, isJsString } from '../../lib/js-kind.ts';
import { isHookName } from './filename.ts';

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

function hookNameFromCall(name: string | undefined): string | undefined {
  if (name === undefined) {
    return undefined;
  }
  const separator = name.lastIndexOf('.');
  return separator === -1 ? name : name.slice(separator + 1);
}

export function isHookCall(node: ESTree.CallExpression): boolean {
  return isHookName(hookNameFromCall(getCallName(node)));
}

export function isBareHookCall(node: ESTree.CallExpression): boolean {
  let current: ESTree.Node = node;
  let parent: ESTree.Node | undefined = node.parent ?? undefined;

  while (parent !== undefined && parent.type === 'ParenthesizedExpression') {
    current = parent;
    parent = parent.parent ?? undefined;
  }

  if (parent === undefined) {
    return true;
  }

  if (parent.type === 'ExpressionStatement') {
    return parent.expression === current;
  }

  if (parent.type === 'VariableDeclarator') {
    return parent.init === current;
  }

  if (parent.type === 'AssignmentExpression') {
    return parent.right === current;
  }

  return false;
}

function isComponentWrapperName(name: string | undefined): boolean {
  return (
    name === 'memo' ||
    name === 'forwardRef' ||
    name === 'React.memo' ||
    name === 'React.forwardRef' ||
    name?.endsWith('.memo') === true ||
    name?.endsWith('.forwardRef') === true
  );
}

export function isComponentWrapperCall(node: ESTree.CallExpression): boolean {
  return isComponentWrapperName(getCallName(node));
}

function isWrapperCallArgument(call: ESTree.CallExpression, node: ESTree.Node): boolean {
  return call.arguments.some((argument) => argument === node);
}

export function unwrapComponentInit(
  node: ESTree.Expression | null | undefined,
): ESTree.Function | ESTree.ArrowFunctionExpression | undefined {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return undefined;
  }
  if (isFunctionLike(expression)) {
    return expression;
  }
  if (expression.type === 'CallExpression' && isComponentWrapperCall(expression)) {
    for (const argument of expression.arguments) {
      if (argument.type === 'SpreadElement') {
        continue;
      }
      const inner = unwrapComponentInit(argument);
      if (inner !== undefined) {
        return inner;
      }
    }
  }
  return undefined;
}

function getAssignedFunctionName(fn: ESTree.Node): string | undefined {
  let current: ESTree.Node = fn;
  let parent: ESTree.Node | undefined = fn.parent ?? undefined;

  while (parent) {
    if (
      parent.type === 'ParenthesizedExpression' ||
      parent.type === 'ChainExpression' ||
      isTsExpressionWrapper(parent)
    ) {
      current = parent;
      parent = parent.parent ?? undefined;
      continue;
    }

    if (
      parent.type === 'CallExpression' &&
      isComponentWrapperCall(parent) &&
      isWrapperCallArgument(parent, current)
    ) {
      current = parent;
      parent = parent.parent ?? undefined;
      continue;
    }

    if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
      return parent.id.name;
    }

    if (parent.type === 'AssignmentExpression' && parent.left.type === 'Identifier') {
      return parent.left.name;
    }

    return undefined;
  }

  return undefined;
}

export function getDeclaredFunctionName(
  node: ESTree.Function | ESTree.ArrowFunctionExpression,
): string | undefined {
  if (
    (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
    node.id?.name !== undefined
  ) {
    return node.id.name;
  }
  return getAssignedFunctionName(node);
}

export function getExportedExpressionName(
  node: ESTree.Node | null | undefined,
): string | undefined {
  if (node === undefined || node === null) {
    return undefined;
  }
  if (node.type === 'FunctionDeclaration') {
    return node.id?.name;
  }
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (isFunctionLike(node)) {
    const component = unwrapComponentInit(node);
    if (component !== undefined) {
      return getDeclaredFunctionName(component) ?? getAssignedFunctionName(component);
    }
    return getDeclaredFunctionName(node);
  }
  if (
    node.type === 'CallExpression' ||
    node.type === 'ParenthesizedExpression' ||
    isTsExpressionWrapper(node)
  ) {
    const component = unwrapComponentInit(node);
    if (component !== undefined) {
      return getDeclaredFunctionName(component) ?? getAssignedFunctionName(component);
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
    if (isFunctionLike(current)) {
      return getDeclaredFunctionName(current);
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
