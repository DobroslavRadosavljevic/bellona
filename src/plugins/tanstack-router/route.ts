import type { ESTree } from '@oxlint/plugins';

import { getCallName, getStaticPropertyName, isFunctionLike, unwrapExpression } from './ast.ts';
import { getObjectPropValue, objectHasOwnProperty } from './router.ts';

export const CREATE_ROUTE_DIRECT = new Set(['createRootRoute', 'createRoute']);

export const CREATE_ROUTE_INDIRECT = new Set(['createFileRoute', 'createRootRouteWithContext']);

const LOADER_PROP = 'loader';
const HANDLER_PROP = 'handler';
const BEFORE_LOAD_PROP = 'beforeLoad';

export const ROUTE_PROPERTY_SORT_RULES: ReadonlyArray<
  readonly [readonly string[], readonly string[]]
> = [
  [['params', 'validateSearch'], ['search']],
  [['search'], ['loaderDeps', 'ssr']],
  [['loaderDeps'], ['context']],
  [['context'], ['beforeLoad']],
  [['beforeLoad'], ['loader']],
  [['loader'], ['onEnter', 'onStay', 'onLeave', 'head', 'scripts', 'headers', 'remountDeps']],
];

export function callLeafName(node: ESTree.CallExpression): string | undefined {
  const name = getCallName(node);
  return name?.split('.').at(-1);
}

export function isNamedCall(node: ESTree.CallExpression, name: string): boolean {
  return callLeafName(node) === name;
}

export function isHookCall(node: ESTree.CallExpression): boolean {
  const leaf = callLeafName(node);
  return leaf !== undefined && /^use[A-Z]/u.test(leaf);
}

export function getCreateRouteOptions(
  node: ESTree.CallExpression,
): { functionName: string; options: ESTree.ObjectExpression } | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'Identifier') {
    return undefined;
  }
  const functionName = callee.name;
  if (CREATE_ROUTE_DIRECT.has(functionName)) {
    return optionsFromArgs(functionName, node.arguments);
  }
  if (!CREATE_ROUTE_INDIRECT.has(functionName)) {
    return undefined;
  }
  const parent = node.parent;
  if (parent?.type !== 'CallExpression' || unwrapExpression(parent.callee) !== node) {
    return undefined;
  }
  return optionsFromArgs(functionName, parent.arguments);
}

function optionsFromArgs(
  functionName: string,
  args: ESTree.CallExpression['arguments'],
): { functionName: string; options: ESTree.ObjectExpression } | undefined {
  const first = args[0];
  if (first === undefined || first.type === 'SpreadElement') {
    return undefined;
  }
  const options = unwrapExpression(first);
  if (options?.type !== 'ObjectExpression') {
    return undefined;
  }
  return { functionName, options };
}

export function routeHasValidateSearch(options: ESTree.ObjectExpression): boolean {
  return objectHasOwnProperty(options, 'validateSearch');
}

function parentOf(node: ESTree.Node): ESTree.Node | undefined {
  return node.parent ?? undefined;
}

function enclosingFunction(node: ESTree.Node): ESTree.Node | undefined {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      return current;
    }
    current = parentOf(current);
  }
  return undefined;
}

function propertyNameOfFunction(fn: ESTree.Node): string | undefined {
  const parent = fn.parent;
  if (parent?.type === 'Property') {
    return getStaticPropertyName(parent.key);
  }
  return undefined;
}

export function isInsideLoaderFunction(node: ESTree.Node): boolean {
  const fn = enclosingFunction(node);
  if (fn === undefined) {
    return false;
  }
  const name = propertyNameOfFunction(fn);
  if (name === LOADER_PROP) {
    return true;
  }
  if (name !== HANDLER_PROP) {
    return false;
  }
  const handlerProperty = fn.parent;
  if (handlerProperty?.type !== 'Property') {
    return false;
  }
  const loaderObject = handlerProperty.parent;
  if (loaderObject?.type !== 'ObjectExpression') {
    return false;
  }
  const loaderProperty = loaderObject.parent;
  return (
    loaderProperty?.type === 'Property' && getStaticPropertyName(loaderProperty.key) === LOADER_PROP
  );
}

export function isInsideRouteLifecycle(node: ESTree.Node): boolean {
  if (isInsideLoaderFunction(node)) {
    return true;
  }
  const fn = enclosingFunction(node);
  if (fn === undefined) {
    return false;
  }
  return propertyNameOfFunction(fn) === BEFORE_LOAD_PROP;
}

function isSearchRead(node: ESTree.Node): boolean {
  if (node.type !== 'Identifier' || !('name' in node) || node.name !== 'search') {
    return false;
  }
  const parent = parentOf(node);
  if (parent === undefined) {
    return false;
  }
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
    return true;
  }
  if (parent.type === 'MemberExpression' && parent.computed && parent.property === node) {
    return false;
  }
  if (
    parent.type === 'Property' &&
    parent.key === node &&
    parent.parent?.type === 'ObjectPattern'
  ) {
    return true;
  }
  return false;
}

export function isSearchIdentifierInLoader(node: ESTree.Node): boolean {
  return isSearchRead(node) && isInsideLoaderFunction(node);
}

export function loaderDepsReadsSearch(options: ESTree.ObjectExpression): boolean {
  const loaderDeps = getObjectPropValue(options, 'loaderDeps');
  if (loaderDeps === undefined) {
    return false;
  }
  const fn = unwrapExpression(loaderDeps);
  if (fn === undefined || !isFunctionLike(fn)) {
    return false;
  }
  return functionParamOrBodyReadsSearch(fn);
}

function functionParamOrBodyReadsSearch(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): boolean {
  for (const param of fn.params) {
    if (objectPatternHasSearch(param)) {
      return true;
    }
  }
  return false;
}

function objectPatternHasSearch(node: ESTree.Node): boolean {
  if (node.type === 'AssignmentPattern') {
    return objectPatternHasSearch(node.left);
  }
  if (node.type !== 'ObjectPattern') {
    return false;
  }
  for (const property of node.properties) {
    if (property.type === 'RestElement') {
      continue;
    }
    const keyName = getStaticPropertyName(property.key);
    if (keyName === 'search') {
      return true;
    }
    if (property.value.type === 'ObjectPattern' && objectPatternHasSearch(property.value)) {
      return true;
    }
  }
  return false;
}

export function pathHasParamToken(value: string): boolean {
  return /\$/u.test(value);
}

export function sortRoutePropertiesByOrder<T extends { name: string }>(
  properties: readonly T[],
): T[] | undefined {
  const orderSets: readonly string[][] = ROUTE_PROPERTY_SORT_RULES.flatMap(([left, right]) => [
    [...left],
    [...right],
  ]);

  const subsetIndex = (name: string): number | undefined => {
    for (const [index, set] of orderSets.entries()) {
      if (set.includes(name)) {
        return index;
      }
    }
    return undefined;
  };

  const ordered = properties.filter((item) => subsetIndex(item.name) !== undefined);
  const sorted = [...ordered];
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === undefined) {
      continue;
    }
    let insertAt = index;
    while (insertAt > 0) {
      const previous = sorted[insertAt - 1];
      if (previous === undefined) {
        break;
      }
      const leftIndex = subsetIndex(previous.name);
      const rightIndex = subsetIndex(current.name);
      if (leftIndex === undefined || rightIndex === undefined || leftIndex <= rightIndex) {
        break;
      }
      sorted[insertAt] = previous;
      insertAt -= 1;
    }
    sorted[insertAt] = current;
  }

  let changed = false;
  const iterator = sorted.values();
  const result = properties.map((item) => {
    if (subsetIndex(item.name) === undefined) {
      return item;
    }
    const next = iterator.next().value;
    if (next === undefined) {
      return item;
    }
    if (next.name !== item.name) {
      changed = true;
    }
    return next;
  });

  return changed ? result : undefined;
}
