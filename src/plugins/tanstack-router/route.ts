import type { ESTree } from '@oxlint/plugins';

import {
  getStaticPropertyName,
  isFunctionLike,
  isReturnArgument,
  isThrowArgument,
  unwrapExpression,
} from './ast.ts';
import { getObjectPropValue, getStaticRoutePathValue } from './router.ts';

export const CREATE_ROUTE_DIRECT = new Set(['createRootRoute', 'createRoute']);

export const CREATE_ROUTE_INDIRECT = new Set(['createFileRoute', 'createRootRouteWithContext']);

const LOADER_PROP = 'loader';
const HANDLER_PROP = 'handler';

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

/**
 * The router handles a thrown or returned `notFound()` from `loader`, `beforeLoad`, and
 * server functions (`router-core` `load-client.js` `normalize`, `start-server-core`
 * `server-functions-handler.js`).
 */
export function isNotFoundHandled(node: ESTree.CallExpression): boolean {
  return isThrowArgument(node) || isReturnArgument(node) || callHasThrowTrue(node);
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

function parentOf(node: ESTree.Node): ESTree.Node | undefined {
  return node.parent ?? undefined;
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

/** A `beforeLoad`, `loader`, or `loader.handler` function: it gets the route context object. */
export function isRouteLifecycleFunction(fn: ESTree.Node): boolean {
  return (
    isFunctionLike(fn) &&
    (functionIsLoaderOrHandler(fn) || propertyNameOfFunction(fn) === 'beforeLoad')
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

function enclosingLoaderFunction(node: ESTree.Node): ESTree.Node | undefined {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current) && functionIsLoaderOrHandler(current)) {
      return current;
    }
    current = parentOf(current);
  }
  return undefined;
}

function isSearchKey(node: ESTree.Node): boolean {
  return getStaticPropertyName(node) === 'search';
}

/** `location`, `window.location`, or `ctx.location`: a parsed location with raw `search`. */
function isLocationObject(node: ESTree.Expression): boolean {
  const object = unwrapExpression(node);
  if (object?.type === 'Identifier') {
    return object.name === 'location';
  }
  return (
    object?.type === 'MemberExpression' && getStaticPropertyName(object.property) === 'location'
  );
}

/** `{ search }` or `{ location: { search } }` on the loader's own context parameter. */
function isLoaderContextSearchKey(node: ESTree.Node, loader: ESTree.Node): boolean {
  if (!isFunctionLike(loader)) {
    return false;
  }
  const property = parentOf(node);
  if (property?.type !== 'Property' || property.key !== node || property.computed) {
    return false;
  }
  const pattern = parentOf(property);
  if (pattern?.type !== 'ObjectPattern') {
    return false;
  }
  const holder = parentOf(pattern);
  if (holder === loader) {
    return loader.params[0] === pattern;
  }
  if (holder?.type === 'AssignmentPattern' && parentOf(holder) === loader) {
    return loader.params[0] === holder;
  }
  return (
    holder?.type === 'Property' &&
    holder.value === pattern &&
    getStaticPropertyName(holder.key) === 'location' &&
    parentOf(holder)?.type === 'ObjectPattern'
  );
}

/** `ctx.search` where `ctx` is the loader's first parameter. */
function isLoaderContextParam(node: ESTree.Expression, loader: ESTree.Node): boolean {
  if (!isFunctionLike(loader)) {
    return false;
  }
  const object = unwrapExpression(node);
  const param = loader.params[0];
  return (
    object?.type === 'Identifier' && param?.type === 'Identifier' && param.name === object.name
  );
}

/**
 * Raw search read inside `loader`: the context's `search`, or `search` on a location.
 * A `search` field on `deps` or on loaded data is not raw search input.
 */
export function isSearchAccessInLoader(node: ESTree.Node): boolean {
  if (node.type === 'Identifier') {
    const loader = isSearchKey(node) ? enclosingLoaderFunction(node) : undefined;
    return loader !== undefined && isLoaderContextSearchKey(node, loader);
  }
  if (node.type !== 'MemberExpression') {
    return false;
  }
  const property = node.computed ? unwrapExpression(node.property) : node.property;
  const readsSearch =
    property !== undefined &&
    isSearchKey(property) &&
    (!node.computed || property.type === 'Literal');
  const loader = readsSearch ? enclosingLoaderFunction(node) : undefined;
  if (loader === undefined) {
    return false;
  }
  return isLocationObject(node.object) || isLoaderContextParam(node.object, loader);
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
