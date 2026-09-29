import type { ESTree } from '@oxlint/plugins';

import { isFunctionLike, unwrapExpression, walkFunctionBody } from './ast.ts';

/** The expression a function returns when its body is one expression or one `return`. */
export function soleReturnedExpression(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): ESTree.Node | undefined {
  const body = fn.body;
  if (body === null || body === undefined) {
    return undefined;
  }
  if (body.type !== 'BlockStatement') {
    return unwrapExpression(body);
  }
  const [only] = body.body;
  if (body.body.length !== 1 || only?.type !== 'ReturnStatement') {
    return undefined;
  }
  return unwrapExpression(only.argument ?? undefined);
}

/** Parameter names of a function. Undefined when a parameter is a pattern (`{ a }`, `...rest`). */
export function simpleParamNames(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): ReadonlySet<string> | undefined {
  const names = new Set<string>();
  for (const param of fn.params) {
    if (param.type !== 'Identifier') {
      return undefined;
    }
    names.add(param.name);
  }
  return names;
}

/** True when any `Identifier` in `node` (not a non-computed property key) has one of `names`. */
export function referencesAnyName(node: ESTree.Node, names: ReadonlySet<string>): boolean {
  if (names.size === 0) {
    return false;
  }
  let found = false;
  walkFunctionBody(node, (child) => {
    if (found || child.type !== 'Identifier' || !names.has(child.name)) {
      return;
    }
    const parent = child.parent;
    const isKey =
      (parent?.type === 'MemberExpression' && parent.property === child && !parent.computed) ||
      (parent?.type === 'Property' &&
        parent.key === child &&
        !parent.computed &&
        !parent.shorthand);
    if (!isKey) {
      found = true;
    }
  });
  if (found) {
    return true;
  }
  // `walkFunctionBody` does not enter nested functions; check them too.
  let nested = false;
  const visitNested = (child: ESTree.Node): void => {
    if (nested) {
      return;
    }
    if (child !== node && isFunctionLike(child)) {
      nested = referencesAnyName(child, names);
    }
  };
  walkFunctionBody(node, visitNested);
  return nested;
}
