import type { ESTree } from '@oxlint/plugins';

import type { RuntimeScalar } from './js-kind.ts';

export function isAstNode(value: RuntimeScalar | readonly RuntimeScalar[]): value is ESTree.Node {
  if (value === null || value === undefined || Array.isArray(value)) {
    return false;
  }
  const boxed = Object(value);
  if (value !== boxed) {
    return false;
  }
  return 'type' in boxed && 'range' in boxed;
}

export function forEachChild(
  node: ESTree.Node,
  keys: readonly string[],
  visit: (child: ESTree.Node) => void,
): void {
  const allowed = new Set(keys);
  for (const [key, value] of Object.entries(node)) {
    if (!allowed.has(key) || key === 'parent') {
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
