import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsString } from '../../lib/js-kind.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from './ast.ts';
import { isInsideLoaderFunction } from './route.ts';
import { resolveIdentifierInit, TANSTACK_ROUTER_MODULES } from './router.ts';

const ROUTER_MODULE_SET = new Set<string>(TANSTACK_ROUTER_MODULES);

export const ROUTE_FACTORY_EXPORTS = new Set([
  'createFileRoute',
  'createRoute',
  'createRootRoute',
  'createRootRouteWithContext',
  'createLazyFileRoute',
  'createLazyRoute',
]);

export const SERVER_FN_EXPORTS = new Set(['createServerFn']);

export const NOT_FOUND_EXPORTS = new Set(['notFound']);

export const REDIRECT_EXPORTS = new Set(['redirect']);

export const USE_LOADER_DATA_EXPORTS = new Set(['useLoaderData']);

export const NOT_FOUND_ROUTE_EXPORTS = new Set(['NotFoundRoute']);

export const GET_ROUTE_API_EXPORTS = new Set(['getRouteApi']);

export const ROUTE_UI_OPTION_NAMES = new Set([
  'component',
  'pendingComponent',
  'errorComponent',
  'notFoundComponent',
]);

const NOT_FOUND_COMPONENT_OPTION = 'notFoundComponent';

const REDIRECT_OBJECTS = new Set(['Route', 'route']);

export type RouterEdgeBindings = {
  readonly namespaces: ReadonlySet<string>;
  readonly routeFactories: ReadonlySet<string>;
  readonly routeFactoryByLocal: ReadonlyMap<string, string>;
  readonly serverFn: ReadonlySet<string>;
  readonly notFound: ReadonlySet<string>;
  readonly redirect: ReadonlySet<string>;
  readonly useLoaderData: ReadonlySet<string>;
  readonly notFoundRoute: ReadonlySet<string>;
  readonly getRouteApi: ReadonlySet<string>;
};

export const DIRECT_ROUTE_OPTION_FACTORIES = new Set(['createRoute', 'createRootRoute']);

export const INDIRECT_ROUTE_OPTION_FACTORIES = new Set([
  'createFileRoute',
  'createRootRouteWithContext',
  'createLazyFileRoute',
  'createLazyRoute',
]);

function parentOf(node: ESTree.Node): ESTree.Node | undefined {
  return node.parent ?? undefined;
}

function walkNodes(node: ESTree.Node, visit: (child: ESTree.Node) => void): void {
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) {
          walkNodes(item, visit);
        }
      }
      continue;
    }
    if (isAstNode(value)) {
      walkNodes(value, visit);
    }
  }
}

function importedModuleName(node: ESTree.ImportSpecifier): string | undefined {
  if (node.imported.type === 'Identifier') {
    return node.imported.name;
  }
  if (isJsString(node.imported.value)) {
    return node.imported.value;
  }
  return undefined;
}

function addCanonicalAndAliasesMap(
  program: ESTree.Program,
  exportedNames: ReadonlySet<string>,
): Map<string, string> {
  const locals = new Map<string, string>();
  for (const name of exportedNames) {
    locals.set(name, name);
  }
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (!isJsString(source) || !ROUTER_MODULE_SET.has(source)) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') {
        continue;
      }
      const exported = importedModuleName(specifier);
      if (exported !== undefined && exportedNames.has(exported)) {
        locals.set(specifier.local.name, exported);
      }
    }
  }
  return locals;
}

function addCanonicalAndAliases(
  program: ESTree.Program,
  exportedNames: ReadonlySet<string>,
): Set<string> {
  return new Set(addCanonicalAndAliasesMap(program, exportedNames).keys());
}

function collectNamespaceLocals(program: ESTree.Program): Set<string> {
  const locals = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (!isJsString(source) || !ROUTER_MODULE_SET.has(source)) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        locals.add(specifier.local.name);
      }
    }
  }
  return locals;
}

export function collectRouterEdgeBindings(program: ESTree.Program): RouterEdgeBindings {
  const routeFactoryByLocal = addCanonicalAndAliasesMap(program, ROUTE_FACTORY_EXPORTS);
  return {
    namespaces: collectNamespaceLocals(program),
    routeFactories: new Set(routeFactoryByLocal.keys()),
    routeFactoryByLocal,
    serverFn: addCanonicalAndAliases(program, SERVER_FN_EXPORTS),
    notFound: addCanonicalAndAliases(program, NOT_FOUND_EXPORTS),
    redirect: addCanonicalAndAliases(program, REDIRECT_EXPORTS),
    useLoaderData: addCanonicalAndAliases(program, USE_LOADER_DATA_EXPORTS),
    notFoundRoute: addCanonicalAndAliases(program, NOT_FOUND_ROUTE_EXPORTS),
    getRouteApi: addCanonicalAndAliases(program, GET_ROUTE_API_EXPORTS),
  };
}

function calleeIdentifierName(
  node: ESTree.CallExpression | ESTree.NewExpression,
): string | undefined {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' ? callee.name : undefined;
}

function calleeNamespaceMember(
  node: ESTree.CallExpression | ESTree.NewExpression,
  namespaces: ReadonlySet<string>,
): string | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return undefined;
  }
  const object = unwrapExpression(callee.object);
  if (object?.type !== 'Identifier' || !namespaces.has(object.name)) {
    return undefined;
  }
  return getStaticPropertyName(callee.property);
}

function isNamedFactoryCall(
  node: ESTree.CallExpression,
  locals: ReadonlySet<string>,
  namespaces: ReadonlySet<string>,
  exportedNames: ReadonlySet<string>,
): boolean {
  const name = calleeIdentifierName(node);
  if (name !== undefined && locals.has(name)) {
    return true;
  }
  const member = calleeNamespaceMember(node, namespaces);
  return member !== undefined && exportedNames.has(member);
}

export function isRouterEdgeFactoryCall(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): boolean {
  return (
    isNamedFactoryCall(node, bindings.routeFactories, bindings.namespaces, ROUTE_FACTORY_EXPORTS) ||
    isNamedFactoryCall(node, bindings.serverFn, bindings.namespaces, SERVER_FN_EXPORTS)
  );
}

export function getRouteFactoryExportName(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): string | undefined {
  const local = calleeIdentifierName(node);
  if (local !== undefined) {
    return bindings.routeFactoryByLocal.get(local);
  }
  const member = calleeNamespaceMember(node, bindings.namespaces);
  if (member !== undefined && ROUTE_FACTORY_EXPORTS.has(member)) {
    return member;
  }
  return undefined;
}

export type AppliedRouteOptions = {
  readonly factoryName: string;
  readonly argument: ESTree.Node;
};

export function getAppliedRouteOptions(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): AppliedRouteOptions | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'CallExpression') {
    const factoryName = getRouteFactoryExportName(callee, bindings);
    if (factoryName === undefined || !INDIRECT_ROUTE_OPTION_FACTORIES.has(factoryName)) {
      return undefined;
    }
    const first = node.arguments[0];
    if (first === undefined) {
      return undefined;
    }
    return { factoryName, argument: first };
  }
  const factoryName = getRouteFactoryExportName(node, bindings);
  if (factoryName === undefined || !DIRECT_ROUTE_OPTION_FACTORIES.has(factoryName)) {
    return undefined;
  }
  const first = node.arguments[0];
  if (first === undefined) {
    return undefined;
  }
  return { factoryName, argument: first };
}

export function isInlineRouteOptions(argument: ESTree.Node): boolean {
  if (argument.type === 'SpreadElement') {
    return false;
  }
  let current: ESTree.Node = argument;
  for (;;) {
    switch (current.type) {
      case 'TSAsExpression':
      case 'TSSatisfiesExpression':
      case 'TSNonNullExpression':
      case 'TSTypeAssertion':
      case 'ParenthesizedExpression':
      case 'ChainExpression':
        current = current.expression;
        continue;
      case 'ObjectExpression':
        if (current.properties.length === 0) {
          return true;
        }
        for (const property of current.properties) {
          if (property.type !== 'SpreadElement') {
            return true;
          }
        }
        return false;
      default:
        return false;
    }
  }
}

export function programDefinesRouterEdge(program: ESTree.Program): boolean {
  const bindings = collectRouterEdgeBindings(program);
  let found = false;
  walkNodes(program, (node) => {
    if (found || node.type !== 'CallExpression') {
      return;
    }
    if (isRouterEdgeFactoryCall(node, bindings)) {
      found = true;
    }
  });
  return found;
}

export function isControlFlowNotFoundCall(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    return bindings.notFound.has(callee.name);
  }
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  if (getStaticPropertyName(callee.property) !== 'notFound') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  return object?.type === 'Identifier' && bindings.namespaces.has(object.name);
}

function isGetRouteApiCall(node: ESTree.CallExpression, bindings: RouterEdgeBindings): boolean {
  return isNamedFactoryCall(node, bindings.getRouteApi, bindings.namespaces, GET_ROUTE_API_EXPORTS);
}

export function isControlFlowRedirectCall(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    return bindings.redirect.has(callee.name);
  }
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  if (getStaticPropertyName(callee.property) !== 'redirect') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  if (object === undefined) {
    return false;
  }
  if (object.type === 'CallExpression') {
    return isGetRouteApiCall(object, bindings);
  }
  if (object.type !== 'Identifier') {
    return false;
  }
  if (REDIRECT_OBJECTS.has(object.name) || bindings.namespaces.has(object.name)) {
    return true;
  }
  const init = resolveIdentifierInit(object);
  if (init === undefined) {
    return false;
  }
  const call = unwrapExpression(init);
  return call?.type === 'CallExpression' && isGetRouteApiCall(call, bindings);
}

export function isRouterControlFlowCall(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): boolean {
  return isControlFlowNotFoundCall(node, bindings) || isControlFlowRedirectCall(node, bindings);
}

function identifierNamesFromValue(value: ESTree.Node): string[] {
  if (value.type === 'Identifier') {
    return [value.name];
  }
  switch (value.type) {
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'ParenthesizedExpression':
    case 'ChainExpression':
      return identifierNamesFromValue(value.expression);
    case 'CallExpression': {
      const names: string[] = [];
      for (const argument of value.arguments) {
        if (argument.type === 'SpreadElement') {
          continue;
        }
        names.push(...identifierNamesFromValue(argument));
      }
      return names;
    }
    default:
      return [];
  }
}

function collectOptionBindingNames(
  program: ESTree.Program,
  optionNames: ReadonlySet<string>,
): Set<string> {
  const names = new Set<string>();
  walkNodes(program, (node) => {
    if (node.type !== 'Property') {
      return;
    }
    const key = getStaticPropertyName(node.key);
    if (key === undefined || !optionNames.has(key)) {
      return;
    }
    for (const name of identifierNamesFromValue(node.value)) {
      names.add(name);
    }
  });
  return names;
}

export function collectRouteUiBindingNames(program: ESTree.Program): ReadonlySet<string> {
  return collectOptionBindingNames(program, ROUTE_UI_OPTION_NAMES);
}

export function collectNotFoundComponentBindingNames(program: ESTree.Program): ReadonlySet<string> {
  return collectOptionBindingNames(program, new Set([NOT_FOUND_COMPONENT_OPTION]));
}

function isTransparentWrapper(node: ESTree.Node): boolean {
  return (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'ParenthesizedExpression' ||
    node.type === 'ChainExpression'
  );
}

function propertyNameOfFunction(fn: ESTree.Node): string | undefined {
  let current = parentOf(fn);
  while (current !== undefined) {
    if (current.type === 'Property') {
      return getStaticPropertyName(current.key);
    }
    if (!isTransparentWrapper(current)) {
      return undefined;
    }
    current = parentOf(current);
  }
  return undefined;
}

function functionBindingName(fn: ESTree.Node): string | undefined {
  if (
    (fn.type === 'FunctionDeclaration' || fn.type === 'FunctionExpression') &&
    fn.id !== null &&
    fn.id !== undefined
  ) {
    return fn.id.name;
  }
  let current = parentOf(fn);
  while (current !== undefined) {
    if (current.type === 'VariableDeclarator' && current.id.type === 'Identifier') {
      return current.id.name;
    }
    if (current.type === 'AssignmentExpression' && current.left.type === 'Identifier') {
      return current.left.name;
    }
    if (current.type === 'Property') {
      break;
    }
    if (!isTransparentWrapper(current)) {
      break;
    }
    current = parentOf(current);
  }
  return undefined;
}

function isInsideNamedFunction(node: ESTree.Node, names: ReadonlySet<string>): boolean {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      const name = functionBindingName(current);
      if (name !== undefined && names.has(name)) {
        return true;
      }
    }
    current = parentOf(current);
  }
  return false;
}

function isInsideOptionFunction(node: ESTree.Node, optionNames: ReadonlySet<string>): boolean {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      const option = propertyNameOfFunction(current);
      if (option !== undefined && optionNames.has(option)) {
        return true;
      }
    }
    current = parentOf(current);
  }
  return false;
}

export function isInsideRouteUi(node: ESTree.Node, uiNames: ReadonlySet<string>): boolean {
  return (
    isInsideOptionFunction(node, ROUTE_UI_OPTION_NAMES) || isInsideNamedFunction(node, uiNames)
  );
}

export function isInsideNotFoundComponent(
  node: ESTree.Node,
  notFoundComponentNames: ReadonlySet<string>,
): boolean {
  return (
    isInsideOptionFunction(node, new Set([NOT_FOUND_COMPONENT_OPTION])) ||
    isInsideNamedFunction(node, notFoundComponentNames)
  );
}

function isServerFnFactoryCall(node: ESTree.CallExpression, bindings: RouterEdgeBindings): boolean {
  return isNamedFactoryCall(node, bindings.serverFn, bindings.namespaces, SERVER_FN_EXPORTS);
}

function expressionIsServerFnChain(node: ESTree.Expression, bindings: RouterEdgeBindings): boolean {
  const unwrapped = unwrapExpression(node);
  if (unwrapped === undefined) {
    return false;
  }
  if (unwrapped.type === 'CallExpression') {
    if (isServerFnFactoryCall(unwrapped, bindings)) {
      return true;
    }
    const callee = unwrapExpression(unwrapped.callee);
    if (callee?.type === 'MemberExpression') {
      const object = unwrapExpression(callee.object);
      if (object !== undefined) {
        return expressionIsServerFnChain(object, bindings);
      }
    }
    return false;
  }
  if (unwrapped.type === 'Identifier') {
    const init = resolveIdentifierInit(unwrapped);
    return init !== undefined && expressionIsServerFnChain(init, bindings);
  }
  return false;
}

function callArgumentIsFunction(call: ESTree.CallExpression, fn: ESTree.Node): boolean {
  for (const argument of call.arguments) {
    if (argument.type === 'SpreadElement') {
      continue;
    }
    if (argument === fn || unwrapExpression(argument) === fn) {
      return true;
    }
  }
  return false;
}

export function isInsideServerFnHandler(node: ESTree.Node, bindings: RouterEdgeBindings): boolean {
  let current = parentOf(node);
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      let parent = parentOf(current);
      while (parent !== undefined) {
        if (parent.type === 'CallExpression' && callArgumentIsFunction(parent, current)) {
          const callee = unwrapExpression(parent.callee);
          if (
            callee?.type === 'MemberExpression' &&
            getStaticPropertyName(callee.property) === 'handler'
          ) {
            const object = unwrapExpression(callee.object);
            if (object !== undefined && expressionIsServerFnChain(object, bindings)) {
              return true;
            }
          }
          break;
        }
        if (!isTransparentWrapper(parent)) {
          break;
        }
        parent = parentOf(parent);
      }
    }
    current = parentOf(current);
  }
  return false;
}

export function isInsideAllowedNotFoundSite(
  node: ESTree.Node,
  bindings: RouterEdgeBindings,
): boolean {
  if (isInsideServerFnHandler(node, bindings)) {
    return true;
  }
  if (isInsideLoaderFunction(node)) {
    return true;
  }
  return isInsideOptionFunction(node, new Set(['beforeLoad']));
}

export function isUseLoaderDataCall(
  node: ESTree.CallExpression,
  bindings: RouterEdgeBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    return bindings.useLoaderData.has(callee.name);
  }
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  return getStaticPropertyName(callee.property) === 'useLoaderData';
}

export function isNotFoundRouteProperty(node: ESTree.Node): boolean {
  return node.type === 'Property' && getStaticPropertyName(node.key) === 'notFoundRoute';
}

export function isNotFoundRouteImportSpecifier(node: ESTree.ImportSpecifier): boolean {
  const exported = importedModuleName(node);
  return exported === 'NotFoundRoute';
}

export function isNotFoundRouteConstruct(
  node: ESTree.CallExpression | ESTree.NewExpression,
  bindings: RouterEdgeBindings,
): boolean {
  const name = calleeIdentifierName(node);
  if (name !== undefined && bindings.notFoundRoute.has(name)) {
    return true;
  }
  const member = calleeNamespaceMember(node, bindings.namespaces);
  return member === 'NotFoundRoute';
}
