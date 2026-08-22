import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
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

export function parentOf(node: ESTree.Node): ESTree.Node | undefined {
  return node.parent ?? undefined;
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

/** Member path `it.effect.skip` → `['it', 'effect', 'skip']`. Walks call callees. */
export function getStaticMemberPath(node: ESTree.Node | undefined): readonly string[] | undefined {
  const names: string[] = [];
  let current = unwrapExpression(node);
  while (current !== undefined) {
    if (current.type === 'Identifier') {
      names.unshift(current.name);
      return names;
    }
    if (current.type === 'MemberExpression') {
      const property = getStaticPropertyName(current.property);
      if (property === undefined) {
        return undefined;
      }
      names.unshift(property);
      current = unwrapExpression(current.object);
      continue;
    }
    if (current.type === 'CallExpression') {
      current = unwrapExpression(current.callee);
      continue;
    }
    return undefined;
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

export function isGeneratorFunction(node: ESTree.Node | undefined): boolean {
  return (
    (node?.type === 'FunctionExpression' || node?.type === 'FunctionDeclaration') &&
    node.generator === true
  );
}

export function getStringLiteral(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Literal' && isJsString(expression.value)) {
    return expression.value;
  }
  return undefined;
}

export function getCallArgument(
  node: ESTree.CallExpression,
  index: number,
): ESTree.Node | undefined {
  const argument = node.arguments[index];
  if (argument === undefined || argument.type === 'SpreadElement') {
    return undefined;
  }
  return unwrapExpression(argument);
}

export function isArrayExpressionArgument(node: ESTree.CallExpression, index: number): boolean {
  return getCallArgument(node, index)?.type === 'ArrayExpression';
}

/** True when `fn` is a direct argument of `call`. */
export function callHasFunctionArgument(call: ESTree.CallExpression, fn: ESTree.Node): boolean {
  return call.arguments.some((argument) => {
    if (argument.type === 'SpreadElement') {
      return false;
    }
    return unwrapExpression(argument) === fn;
  });
}

export function isReturnedNode(node: ESTree.Node): boolean {
  let current: ESTree.Node = node;
  while (true) {
    const parent = parentOf(current);
    if (parent === undefined) {
      return false;
    }
    if (parent.type === 'ParenthesizedExpression' || isTsExpressionWrapper(parent)) {
      current = parent;
      continue;
    }
    if (parent.type === 'ReturnStatement') {
      return parent.argument === current;
    }
    if (
      parent.type === 'ArrowFunctionExpression' &&
      parent.expression === true &&
      parent.body === current
    ) {
      return true;
    }
    return false;
  }
}

/** Follow `.pipe(...)` to the leftmost receiver. */
export function pipeRoot(node: ESTree.Node | undefined): ESTree.Node | undefined {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    const callee = unwrapExpression(current.callee);
    if (callee?.type !== 'MemberExpression') {
      return current;
    }
    if (getStaticPropertyName(callee.property) !== 'pipe') {
      return current;
    }
    current = unwrapExpression(callee.object);
  }
  return current;
}

export function getBindingNameForInitializer(node: ESTree.Node): string | undefined {
  const parent = parentOf(node);
  if (parent?.type === 'VariableDeclarator' && parent.init === node) {
    return parent.id.type === 'Identifier' ? parent.id.name : undefined;
  }
  if (parent?.type === 'AssignmentExpression' && parent.right === node) {
    const left = unwrapExpression(parent.left);
    return left?.type === 'Identifier' ? left.name : undefined;
  }
  if (
    parent?.type === 'Property' &&
    parent.value === node &&
    (parent.kind === 'init' || parent.kind === undefined)
  ) {
    return getStaticPropertyName(parent.key);
  }
  if (parent?.type === 'PropertyDefinition' && parent.value === node) {
    return getStaticPropertyName(parent.key);
  }
  if (
    parent !== undefined &&
    (isTsExpressionWrapper(parent) || parent.type === 'ParenthesizedExpression')
  ) {
    return getBindingNameForInitializer(parent);
  }
  return undefined;
}

export function enclosingFunction(node: ESTree.Node): ESTree.Node | undefined {
  let current: ESTree.Node | undefined = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      return current;
    }
    current = parentOf(current);
  }
  return undefined;
}

export function enclosingClass(node: ESTree.Node): ESTree.Class | undefined {
  let current: ESTree.Node | undefined = parentOf(node);
  while (current !== undefined) {
    if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
      return current;
    }
    current = parentOf(current);
  }
  return undefined;
}

export function isInsideSuperClass(node: ESTree.Node): boolean {
  const cls = enclosingClass(node);
  if (cls === undefined || cls.superClass === null || cls.superClass === undefined) {
    return false;
  }
  let current: ESTree.Node | undefined = node;
  while (current !== undefined && current !== cls) {
    if (current === cls.superClass) {
      return true;
    }
    current = parentOf(current);
  }
  return false;
}

export function classNameOf(node: ESTree.Class): string | undefined {
  if (node.id?.type === 'Identifier') {
    return node.id.name;
  }
  return getBindingNameForInitializer(node);
}

export function hasStaticClassMember(node: ESTree.Class, name: string): boolean {
  for (const element of node.body.body) {
    if (element.type !== 'MethodDefinition' && element.type !== 'PropertyDefinition') {
      continue;
    }
    if (!element.static) {
      continue;
    }
    if (getStaticPropertyName(element.key) === name) {
      return true;
    }
  }
  return false;
}

export function objectHasMakeOption(node: ESTree.Node | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'ObjectExpression') {
    return false;
  }
  for (const property of expression.properties) {
    if (property.type === 'SpreadElement') {
      return true;
    }
    if (getStaticPropertyName(property.key) === 'make') {
      return true;
    }
  }
  return false;
}

export function visitAstChildren(node: ESTree.Node, visit: (child: ESTree.Node) => void): void {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) {
          visit(item);
        }
      }
      continue;
    }
    if (isAstNode(value)) {
      visit(value);
    }
  }
}

/** Walk a function body; do not enter nested functions. */
export function walkFunctionBody(fn: ESTree.Node, visit: (node: ESTree.Node) => void): void {
  const visitNode = (node: ESTree.Node): void => {
    visit(node);
    if (node !== fn && isFunctionLike(node)) {
      return;
    }
    visitAstChildren(node, visitNode);
  };
  visitNode(fn);
}
