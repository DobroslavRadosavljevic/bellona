import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import {
  getCallName,
  getTagName,
  isAllowedCallee,
  isFunctionLike,
  unwrapExpression,
} from './ast.ts';

function cookedTemplateText(node: ESTree.TemplateLiteral): string {
  const chunks: string[] = [];
  for (const quasi of node.quasis) {
    const cooked = quasi.value.cooked;
    chunks.push(cooked === null || cooked === undefined ? quasi.value.raw : cooked);
  }
  return chunks.join(' ');
}

function pushLiteralText(node: ESTree.Node, parts: string[]): void {
  if (node.type === 'Literal' && isJsString(node.value)) {
    parts.push(node.value);
    return;
  }
  if (node.type === 'TemplateLiteral') {
    parts.push(cookedTemplateText(node));
  }
}

/** Collect string text from a constant initializer. Skip `tv` / allowed factories and JSX. */
export function collectClassNameText(
  node: ESTree.Node,
  allowedCallees: readonly string[],
  parts: string[],
): void {
  const current = unwrapExpression(node);
  if (current === undefined) {
    return;
  }
  if (isFunctionLike(current) || current.type === 'ClassExpression') {
    return;
  }
  if (current.type === 'JSXElement' || current.type === 'JSXFragment') {
    return;
  }
  if (current.type === 'CallExpression') {
    if (isAllowedCallee(getCallName(current), allowedCallees)) {
      return;
    }
    for (const argument of current.arguments) {
      if (argument.type === 'SpreadElement') {
        collectClassNameText(argument.argument, allowedCallees, parts);
        continue;
      }
      collectClassNameText(argument, allowedCallees, parts);
    }
    return;
  }
  if (current.type === 'NewExpression') {
    for (const argument of current.arguments) {
      if (argument.type === 'SpreadElement') {
        collectClassNameText(argument.argument, allowedCallees, parts);
        continue;
      }
      collectClassNameText(argument, allowedCallees, parts);
    }
    return;
  }
  if (current.type === 'TaggedTemplateExpression') {
    if (isAllowedCallee(getTagName(current), allowedCallees)) {
      return;
    }
    collectClassNameText(current.quasi, allowedCallees, parts);
    return;
  }
  if (current.type === 'ArrayExpression') {
    for (const element of current.elements) {
      if (element !== null) {
        collectClassNameText(element, allowedCallees, parts);
      }
    }
    return;
  }
  if (current.type === 'ObjectExpression') {
    for (const property of current.properties) {
      if (property.type === 'SpreadElement') {
        collectClassNameText(property.argument, allowedCallees, parts);
        continue;
      }
      collectClassNameText(property.value, allowedCallees, parts);
    }
    return;
  }
  if (current.type === 'ConditionalExpression') {
    collectClassNameText(current.consequent, allowedCallees, parts);
    collectClassNameText(current.alternate, allowedCallees, parts);
    return;
  }
  if (
    current.type === 'LogicalExpression' ||
    current.type === 'BinaryExpression' ||
    current.type === 'AssignmentExpression'
  ) {
    collectClassNameText(current.left, allowedCallees, parts);
    collectClassNameText(current.right, allowedCallees, parts);
    return;
  }
  if (current.type === 'SequenceExpression') {
    for (const expression of current.expressions) {
      collectClassNameText(expression, allowedCallees, parts);
    }
    return;
  }
  if (current.type === 'AwaitExpression' || current.type === 'YieldExpression') {
    if (current.argument !== null && current.argument !== undefined) {
      collectClassNameText(current.argument, allowedCallees, parts);
    }
    return;
  }
  if (current.type === 'SpreadElement') {
    collectClassNameText(current.argument, allowedCallees, parts);
    return;
  }
  pushLiteralText(current, parts);
}
