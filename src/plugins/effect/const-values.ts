import type { ESTree } from '@oxlint/plugins';

import { visitAstChildren } from './ast.ts';

/**
 * `const` initializers in a file, by name. A name that the file declares more than once
 * (in any scope, or as a parameter) is left out, so a lookup never picks the wrong one.
 */
export function collectConstValues(
  program: ESTree.Program | undefined,
): ReadonlyMap<string, ESTree.Node> {
  const values = new Map<string, ESTree.Node>();
  const seen = new Set<string>();
  const declare = (name: string, init: ESTree.Node | undefined): void => {
    if (seen.has(name)) {
      values.delete(name);
      return;
    }
    seen.add(name);
    if (init !== undefined) {
      values.set(name, init);
    }
  };
  const visit = (node: ESTree.Node): void => {
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (declarator.id.type !== 'Identifier') {
          continue;
        }
        const init = node.kind === 'const' ? (declarator.init ?? undefined) : undefined;
        declare(declarator.id.name, init);
      }
    }
    if (
      (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') &&
      node.params.length > 0
    ) {
      for (const param of node.params) {
        if (param.type === 'Identifier') {
          declare(param.name, undefined);
        }
      }
    }
    visitAstChildren(node, visit);
  };
  if (program !== undefined) {
    visit(program);
  }
  return values;
}
