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

export function getTagName(node: ESTree.TaggedTemplateExpression): string | undefined {
  const tag = unwrapExpression(node.tag);
  if (tag === undefined) {
    return undefined;
  }
  if (tag.type === 'Identifier') {
    return tag.name;
  }
  if (tag.type === 'MemberExpression') {
    return getStaticPropertyName(tag.property);
  }
  return undefined;
}

export function isAllowedCallee(name: string | undefined, allowed: readonly string[]): boolean {
  if (name === undefined) {
    return false;
  }
  for (const callee of allowed) {
    if (name === callee || name.endsWith(`.${callee}`)) {
      return true;
    }
  }
  return false;
}

export function isFunctionLike(
  node: ESTree.Node,
): node is ESTree.Function | ESTree.ArrowFunctionExpression {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression' ||
    node.type === 'FunctionDeclaration'
  );
}

export function bindingName(id: ESTree.Node): string | undefined {
  if (id.type === 'Identifier') {
    return id.name;
  }
  if (id.type === 'PrivateIdentifier') {
    return id.name;
  }
  return undefined;
}
