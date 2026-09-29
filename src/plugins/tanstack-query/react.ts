import type { ESTree } from '@oxlint/plugins';

import { propertyName, unwrap } from './ast.ts';

export type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

export function isFunctionNode(node: ESTree.Node | null | undefined): node is FunctionNode {
  return (
    node?.type === 'FunctionDeclaration' ||
    node?.type === 'FunctionExpression' ||
    node?.type === 'ArrowFunctionExpression'
  );
}

export function enclosingFunction(node: ESTree.Node): FunctionNode | undefined {
  let current = node.parent ?? undefined;
  while (current !== undefined) {
    if (isFunctionNode(current)) return current;
    current = current.parent ?? undefined;
  }
  return undefined;
}

/**
 * Name of a function: its own id, or the variable that holds it, also through wrapper calls
 * such as `memo(function Name() {})` or `const Name = forwardRef(() => ...)`.
 */
export function functionName(fn: FunctionNode): string | undefined {
  if (fn.type !== 'ArrowFunctionExpression' && fn.id != null) return fn.id.name;
  let current: ESTree.Node | undefined = fn.parent ?? undefined;
  while (current !== undefined) {
    if (current.type === 'VariableDeclarator')
      return current.id.type === 'Identifier' ? current.id.name : undefined;
    if (current.type !== 'CallExpression' && unwrap(current) === current) return undefined;
    current = current.parent ?? undefined;
  }
  return undefined;
}

/** React naming rules: a component starts with a capital letter, a hook with `use`. */
export function isComponentOrHook(fn: FunctionNode): boolean {
  const name = functionName(fn);
  return name !== undefined && (/^[A-Z]/u.test(name) || /^use[A-Z0-9]/u.test(name));
}

/** `useEffect(...)` or `React.useEffect(...)`. Returns the hook name when it is in `names`. */
export function reactHookName(
  node: ESTree.CallExpression,
  names: ReadonlySet<string>,
): string | undefined {
  const callee = unwrap(node.callee);
  const name =
    callee?.type === 'Identifier'
      ? callee.name
      : callee?.type === 'MemberExpression'
        ? propertyName(callee.property, callee.computed)
        : undefined;
  return name !== undefined && names.has(name) ? name : undefined;
}
