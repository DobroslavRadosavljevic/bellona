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

export function getMemberRootName(node: ESTree.Expression | undefined): string | undefined {
  let current = unwrapExpression(node);
  while (current?.type === 'MemberExpression') {
    current = unwrapExpression(current.object);
  }
  return current?.type === 'Identifier' ? current.name : undefined;
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

/** True when `expr` is `z.string(...)` (not `z.coerce.string()`). */
export function isZStringFactoryCall(node: ESTree.Expression | undefined): boolean {
  const current = unwrapExpression(node);
  if (current?.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(current.callee);
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  return (
    object?.type === 'Identifier' &&
    object.name === 'z' &&
    getStaticPropertyName(callee.property) === 'string'
  );
}

/**
 * True when a format method is chained from `z.string()`
 * (`z.string().email()`, `z.string().min(1).email()`).
 * False for `z.coerce.string().email()` and non-`z` receivers.
 */
export function isZStringSchemaExpression(node: ESTree.Expression | undefined): boolean {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    if (isZStringFactoryCall(current)) {
      return true;
    }
    const callee = unwrapExpression(current.callee);
    if (callee?.type !== 'MemberExpression') {
      return false;
    }
    const object = unwrapExpression(callee.object);
    if (object?.type === 'CallExpression') {
      current = object;
      continue;
    }
    return false;
  }
  return false;
}
