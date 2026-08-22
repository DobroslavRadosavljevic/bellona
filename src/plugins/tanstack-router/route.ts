import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsString } from '../../lib/js-kind.ts';
import {
  getCallName,
  getStaticPropertyName,
  isFunctionLike,
  isReturnArgument,
  isThrowArgument,
  unwrapExpression,
} from './ast.ts';
import { getObjectPropValue, getStaticRoutePathValue, objectHasOwnProperty } from './router.ts';

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
  if (leaf === 'use') {
    const callee = unwrapExpression(node.callee);
    if (callee?.type === 'Identifier') {
      return callee.name === 'use';
    }
    if (callee?.type === 'MemberExpression') {
      const object = unwrapExpression(callee.object);
      return object?.type === 'Identifier' && object.name === 'React';
    }
    return false;
  }
  return leaf !== undefined && /^use[A-Z]/u.test(leaf);
}

const REDIRECT_OBJECTS = new Set(['Route', 'route']);

export function isRouterRedirectCall(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    return callee.name === 'redirect';
  }
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  if (getStaticPropertyName(callee.property) !== 'redirect') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  return object?.type === 'Identifier' && REDIRECT_OBJECTS.has(object.name);
}

export function isRouterNotFoundCall(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && callee.name === 'notFound';
}

export function callHasThrowTrue(node: ESTree.CallExpression): boolean {
  const first = node.arguments[0];
  if (first === undefined || first.type === 'SpreadElement') {
    return false;
  }
  const throwValue = getObjectPropValue(first, 'throw');
  const unwrapped = unwrapExpression(throwValue);
  return unwrapped?.type === 'Literal' && unwrapped.value === true;
}

export function isRedirectHandled(node: ESTree.CallExpression): boolean {
  return isThrowArgument(node) || isReturnArgument(node) || callHasThrowTrue(node);
}

export function isNotFoundHandled(node: ESTree.CallExpression): boolean {
  return isThrowArgument(node) || callHasThrowTrue(node);
}

export type CreatedRoute = {
  functionName: string;
  options: ESTree.ObjectExpression;
  routePath: string | undefined;
};

export function getCreateRouteOptions(node: ESTree.CallExpression): CreatedRoute | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'Identifier') {
    return undefined;
  }
  const functionName = callee.name;
  if (CREATE_ROUTE_DIRECT.has(functionName)) {
    return optionsFromArgs(functionName, node.arguments, undefined);
  }
  if (!CREATE_ROUTE_INDIRECT.has(functionName)) {
    return undefined;
  }
  const parent = node.parent;
  if (parent?.type !== 'CallExpression' || unwrapExpression(parent.callee) !== node) {
    return undefined;
  }
  const factoryPath = getStaticRoutePathValue(node.arguments[0]);
  return optionsFromArgs(functionName, parent.arguments, factoryPath);
}

function optionsFromArgs(
  functionName: string,
  args: ESTree.CallExpression['arguments'],
  factoryPath: string | undefined,
): CreatedRoute | undefined {
  const first = args[0];
  if (first === undefined || first.type === 'SpreadElement') {
    return undefined;
  }
  const options = unwrapExpression(first);
  if (options?.type !== 'ObjectExpression') {
    return undefined;
  }
  const optionPath = getStaticRoutePathValue(getObjectPropValue(options, 'path'));
  return { functionName, options, routePath: factoryPath ?? optionPath };
}

export function getCallFromPath(node: ESTree.CallExpression): string | undefined {
  const first = node.arguments[0];
  if (first === undefined || first.type === 'SpreadElement') {
    return undefined;
  }
  return getStaticRoutePathValue(getObjectPropValue(first, 'from'));
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

function functionIsLoaderOrHandler(fn: ESTree.Node): boolean {
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

export function isInsideLoaderFunction(node: ESTree.Node): boolean {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current) && functionIsLoaderOrHandler(current)) {
      return true;
    }
    current = parentOf(current);
  }
  return false;
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
  if (parent.type === 'MemberExpression' && parent.object === node) {
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

function isComputedSearchMember(node: ESTree.Node): boolean {
  if (node.type !== 'MemberExpression' || !node.computed) {
    return false;
  }
  const property = unwrapExpression(node.property);
  return property?.type === 'Literal' && isJsString(property.value) && property.value === 'search';
}

export function isSearchAccess(node: ESTree.Node): boolean {
  return isSearchRead(node) || isComputedSearchMember(node);
}

export function isSearchAccessInLoader(node: ESTree.Node): boolean {
  return isSearchAccess(node) && isInsideLoaderFunction(node);
}

function subtreeReadsSearch(node: ESTree.Node): boolean {
  if (isSearchAccess(node)) {
    return true;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item) && subtreeReadsSearch(item)) {
          return true;
        }
      }
      continue;
    }
    if (isAstNode(value) && subtreeReadsSearch(value)) {
      return true;
    }
  }
  return false;
}

function routeOptionFunctionReadsSearch(options: ESTree.ObjectExpression, name: string): boolean {
  const value = getObjectPropValue(options, name);
  if (value === undefined) {
    return false;
  }
  const fn = unwrapExpression(value);
  if (fn === undefined || !isFunctionLike(fn)) {
    return false;
  }
  return subtreeReadsSearch(fn);
}

export function loaderDepsReadsSearch(options: ESTree.ObjectExpression): boolean {
  return routeOptionFunctionReadsSearch(options, 'loaderDeps');
}

export function beforeLoadReadsSearch(options: ESTree.ObjectExpression): boolean {
  return routeOptionFunctionReadsSearch(options, 'beforeLoad');
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
