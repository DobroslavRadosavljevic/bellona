import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsNumber, isJsString, type RuntimeScalar } from '../../lib/js-kind.ts';
import { getCallName, getStaticPropertyName, isFunctionLike, unwrapExpression } from './ast.ts';

function visitAstChildren(node: ESTree.Node, visit: (child: ESTree.Node) => void): void {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
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

/** HTTP verb methods on an Elysia instance. */
export const ELYSIA_ROUTE_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'all',
  'connect',
  'route',
]);

/** Methods that typically carry a request body / mutation payload. */
export const DEFAULT_SCHEMA_REQUIRED_METHODS = ['post', 'put', 'patch'] as const;

/** Hook object keys that count as request validation schemas. */
export const ROUTE_SCHEMA_KEYS = new Set(['body', 'query', 'params', 'headers', 'cookie']);

/** Lifecycle callback keys on a route / guard hook object. */
export const ROUTE_LIFECYCLE_HOOK_KEYS = new Set([
  'beforeHandle',
  'afterHandle',
  'onError',
  'error',
  'parse',
  'transform',
  'mapResponse',
  'afterResponse',
  'resolve',
]);

/** Instance lifecycle registration methods. */
export const ELYSIA_LIFECYCLE_METHODS = new Set([
  'onBeforeHandle',
  'onAfterHandle',
  'onError',
  'onRequest',
  'onParse',
  'onTransform',
  'onAfterResponse',
  'derive',
  'resolve',
  'mapDerive',
  'mapResolve',
  'mapResponse',
]);

export const isElysiaRouteMethod = (method: string | undefined): boolean =>
  Boolean(method && ELYSIA_ROUTE_METHODS.has(method));

/** True when the file imports from `elysia` (gates all Elysia rules). */
export const programImportsElysia = (program: ESTree.Program | undefined): boolean => {
  if (!program) {
    return false;
  }
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (isJsString(source) && (source === 'elysia' || source.startsWith('elysia/'))) {
      return true;
    }
  }
  return false;
};

const callLeafName = (node: ESTree.CallExpression): string | undefined => {
  const callName = getCallName(node);
  return callName?.split('.').at(-1) ?? undefined;
};

/**
 * Resolve the route method from a call like `app.post(...)` /
 * `app.route("POST", ...)`.
 */
export const getElysiaRouteMethod = (node: ESTree.CallExpression): string | undefined => {
  const leaf = callLeafName(node);
  if (!leaf) {
    return undefined;
  }

  if (leaf === 'route') {
    const [methodArg] = node.arguments;
    if (
      methodArg &&
      methodArg.type !== 'SpreadElement' &&
      methodArg.type === 'Literal' &&
      isJsString(methodArg.value)
    ) {
      return methodArg.value.toLowerCase();
    }
    return 'route';
  }

  return isElysiaRouteMethod(leaf) ? leaf : undefined;
};

/** True when an object literal defines the given property key. */
export const objectHasOwnProperty = (
  node: ESTree.ObjectExpression,
  propertyName: string,
): boolean => {
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) === propertyName) {
      return true;
    }
  }
  return false;
};

/**
 * True when an object literal has `propertyName: true` (literal boolean).
 * Spreads are treated as unknown (returns false, caller decides).
 */
export const objectHasTrueProperty = (
  node: ESTree.ObjectExpression,
  propertyName: string,
): boolean => {
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) !== propertyName) {
      continue;
    }
    const value = unwrapExpression(property.value);
    return value?.type === 'Literal' && value.value === true;
  }
  return false;
};

/** True when the object has a property with the given name (any value). */
export const objectHasNamedProperty = (
  node: ESTree.ObjectExpression,
  propertyName: string,
): boolean => {
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) === propertyName) {
      return true;
    }
  }
  return false;
};

/** True when `node` is `.guard({ … })` (first arg is / resolves to an object). */
export const isElysiaGuardCall = (node: ESTree.CallExpression): boolean => {
  const leaf = callLeafName(node);
  if (leaf !== 'guard') {
    return false;
  }
  const [first] = node.arguments;
  if (!first || first.type === 'SpreadElement') {
    return false;
  }
  const resolved = resolveIdentifierInit(first) ?? unwrapExpression(first);
  return resolved?.type === 'ObjectExpression';
};

/** Guard hook object for a `.guard({…})` call. */
export const getElysiaGuardHookObject = (
  node: ESTree.CallExpression,
): ESTree.ObjectExpression | undefined => {
  if (!isElysiaGuardCall(node)) {
    return undefined;
  }
  const [first] = node.arguments;
  if (!first || first.type === 'SpreadElement') {
    return undefined;
  }
  const resolved = resolveIdentifierInit(first) ?? unwrapExpression(first);
  return resolved?.type === 'ObjectExpression' ? resolved : undefined;
};

/** True when an object literal contains a spread element. */
export const objectHasSpread = (node: ESTree.ObjectExpression): boolean =>
  node.properties.some((property) => property.type === 'SpreadElement');

/** Find a variable declarator init for `name` in a declaration list. */
const findBindingInitInDeclarations = (
  declarations: readonly ESTree.VariableDeclarator[],
  name: string,
): ESTree.Node | undefined => {
  for (const declarator of declarations) {
    if (declarator.id.type === 'Identifier' && declarator.id.name === name && declarator.init) {
      return unwrapExpression(declarator.init);
    }
  }
  return undefined;
};

/**
 * Resolve a same-file identifier to its nearest VariableDeclarator init.
 */
export const resolveIdentifierInit = (node: ESTree.Node | undefined): ESTree.Node | undefined => {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'Identifier') {
    return expression;
  }

  const { name } = expression;
  let current: ESTree.Node | undefined = expression.parent ?? undefined;

  while (current) {
    if (current.type === 'BlockStatement' || current.type === 'Program') {
      const body = current.type === 'Program' ? current.body : current.body;
      for (const statement of body) {
        if (statement.type !== 'VariableDeclaration') {
          continue;
        }
        const found = findBindingInitInDeclarations(statement.declarations, name);
        if (found) {
          return found;
        }
      }
      if (current.type === 'Program') {
        return undefined;
      }
    }

    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      // Function params shadow outer bindings: stop resolving through them
      // when the identifier is not the function itself.
      for (const param of current.params) {
        if (param.type === 'Identifier' && param.name === name) {
          return undefined;
        }
      }
    }

    current = current.parent ?? undefined;
  }
  return undefined;
};

/** Binding name when `fn` is a named declaration or const init. */
const getFunctionBindingName = (fn: ESTree.Node): string | undefined => {
  if (fn.type === 'FunctionDeclaration' && fn.id?.type === 'Identifier') {
    return fn.id.name;
  }
  const { parent } = fn;
  if (
    parent?.type === 'VariableDeclarator' &&
    parent.id.type === 'Identifier' &&
    parent.init === fn
  ) {
    return parent.id.name;
  }
  return undefined;
};

/** True when a route/lifecycle call references a named handler binding. */
const callUsesNamedHandler = (
  call: ESTree.CallExpression,
  name: string,
  target: ESTree.Node,
): boolean => {
  const leaf = callLeafName(call);
  if (!leaf) {
    return false;
  }

  if (isElysiaRouteMethod(leaf)) {
    const argument = call.arguments[leaf === 'route' ? 2 : 1];
    if (!argument || argument.type === 'SpreadElement') {
      return false;
    }
    const expression = unwrapExpression(argument);
    return (
      expression === target ||
      (expression?.type === 'Identifier' && expression.name === name) ||
      resolveIdentifierInit(argument) === target
    );
  }

  if (ELYSIA_LIFECYCLE_METHODS.has(leaf)) {
    return call.arguments.some((argument) => {
      if (!argument || argument.type === 'SpreadElement') {
        return false;
      }
      const expression = unwrapExpression(argument);
      return (
        expression === target ||
        (expression?.type === 'Identifier' && expression.name === name) ||
        resolveIdentifierInit(argument) === target
      );
    });
  }

  return false;
};

/** True when a named function is referenced as an Elysia route/lifecycle handler. */
export const isFunctionReferencedAsElysiaHandler = (fn: ESTree.Node): boolean => {
  const name = getFunctionBindingName(fn);
  if (!name) {
    return false;
  }

  let program: ESTree.Program | undefined = undefined;
  let current: ESTree.Node | undefined = fn;
  while (current) {
    if (current.type === 'Program') {
      program = current;
      break;
    }
    current = current.parent ?? undefined;
  }
  if (!program) {
    return false;
  }

  /** Depth-first search for handler references to `name`. */
  const visit = (node: ESTree.Node): boolean => {
    if (node.type === 'CallExpression' && callUsesNamedHandler(node, name, fn)) {
      return true;
    }
    let matched = false;
    visitAstChildren(node, (child) => {
      if (!matched && visit(child)) {
        matched = true;
      }
    });
    if (matched) {
      return true;
    }
    return false;
  };

  return visit(program);
};

/** Hook / schema object for a route call (trailing object, possibly via ident). */
export const getElysiaRouteHookObject = (
  node: ESTree.CallExpression,
): ESTree.ObjectExpression | undefined => {
  const leaf = callLeafName(node);
  if (!leaf || !isElysiaRouteMethod(leaf)) {
    return undefined;
  }

  const minArgs = leaf === 'route' ? 4 : 3;
  if (node.arguments.length < minArgs) {
    return undefined;
  }

  const last = node.arguments.at(-1);
  if (!last || last.type === 'SpreadElement') {
    return undefined;
  }

  const resolved = resolveIdentifierInit(last) ?? unwrapExpression(last);
  return resolved?.type === 'ObjectExpression' ? resolved : undefined;
};

/** True when a route hook object declares any schema key. */
export const routeHookHasSchema = (hook: ESTree.ObjectExpression | undefined): boolean => {
  if (!hook) {
    return false;
  }
  // Spreads may inject schema keys we can't see. Treat as satisfied.
  if (objectHasSpread(hook)) {
    return true;
  }
  for (const key of ROUTE_SCHEMA_KEYS) {
    if (objectHasOwnProperty(hook, key)) {
      return true;
    }
  }
  return false;
};

/**
 * Nearest enclosing `.guard({…}, …)` / `.group(path, {…}, …)` schema object.
 */
export const getEnclosingElysiaGuardHook = (
  node: ESTree.Node,
): ESTree.ObjectExpression | undefined => {
  let child: ESTree.Node = node;
  let current: ESTree.Node | undefined = node.parent ?? undefined;

  while (current) {
    // `.post(…).guard({…})`: the route is in the guard callee chain, not in its
    // callback, so the guard does not apply to it.
    if (current.type === 'CallExpression' && current.callee !== child) {
      const leaf = callLeafName(current);
      if (leaf === 'guard') {
        const [first] = current.arguments;
        if (first && first.type !== 'SpreadElement') {
          const resolved = resolveIdentifierInit(first) ?? unwrapExpression(first);
          if (resolved?.type === 'ObjectExpression') {
            return resolved;
          }
        }
      }
      if (leaf === 'group' && current.arguments.length >= 3) {
        const [, second] = current.arguments;
        if (second && second.type !== 'SpreadElement') {
          const resolved = resolveIdentifierInit(second) ?? unwrapExpression(second);
          if (resolved?.type === 'ObjectExpression') {
            return resolved;
          }
        }
      }
    }
    child = current;
    current = current.parent ?? undefined;
  }

  return undefined;
};

/**
 * Hook objects of `.guard({…})` calls (no callback) earlier in the receiver
 * chain of a route call. Elysia applies such a guard to every route that is
 * registered after it on the same instance.
 *
 * @see https://elysiajs.com/essential/plugin.html#guard
 */
export const getChainedElysiaGuardHooks = (
  node: ESTree.CallExpression,
): ESTree.ObjectExpression[] => {
  const hooks: ESTree.ObjectExpression[] = [];
  const seen = new Set<ESTree.Node>();
  let current = unwrapExpression(node.callee);

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current.type === 'MemberExpression') {
      current = unwrapExpression(current.object);
      continue;
    }
    if (current.type === 'Identifier') {
      const init = resolveIdentifierInit(current);
      current = init === current ? undefined : init;
      continue;
    }
    if (current.type !== 'CallExpression') {
      break;
    }
    if (callLeafName(current) === 'guard' && current.arguments.length === 1) {
      const hook = getElysiaGuardHookObject(current);
      if (hook) {
        hooks.push(hook);
      }
    }
    current = unwrapExpression(current.callee);
  }

  return hooks;
};

/** Guard / group hooks that apply to a route call (enclosing callback or chained guard). */
export const getApplicableGuardHooks = (node: ESTree.CallExpression): ESTree.ObjectExpression[] => {
  const hooks = getChainedElysiaGuardHooks(node);
  const enclosing = getEnclosingElysiaGuardHook(node);
  if (enclosing) {
    hooks.push(enclosing);
  }
  return hooks;
};

/** `new Elysia(...)` call. */
export const isNewElysiaExpression = (
  node: ESTree.Node | undefined,
): node is ESTree.NewExpression => {
  if (node?.type !== 'NewExpression') {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && callee.name === 'Elysia';
};

/**
 * True when expression is (or same-file-resolves to) a `new Elysia(...)` chain.
 * Walks method-call chains (`new Elysia().get().use`) and identifier bindings.
 */
export const isElysiaInstanceExpression = (
  node: ESTree.Node | undefined,
  seen: Set<ESTree.Node> = new Set<ESTree.Node>(),
): boolean => {
  const expression = unwrapExpression(node);
  if (!expression || seen.has(expression)) {
    return false;
  }
  seen.add(expression);

  if (isNewElysiaExpression(expression)) {
    return true;
  }

  // Method chain: expr.method(...) → check expr
  if (expression.type === 'CallExpression') {
    const callee = unwrapExpression(expression.callee);
    if (callee?.type === 'MemberExpression') {
      return isElysiaInstanceExpression(callee.object, seen);
    }
    return false;
  }

  if (expression.type === 'Identifier') {
    const init = resolveIdentifierInit(expression);
    if (init && init !== expression) {
      return isElysiaInstanceExpression(init, seen);
    }
    return false;
  }

  return false;
};

/**
 * Effect-style `SomethingService.use` / `Context.Service.use` receivers.
 * Defense in depth: never treat these as Elysia `.use` plugin callbacks.
 */
export const isEffectServiceUseReceiver = (node: ESTree.Node | undefined): boolean => {
  const expression = unwrapExpression(node);
  if (!expression) {
    return false;
  }

  if (expression.type === 'Identifier') {
    return expression.name.endsWith('Service');
  }

  if (expression.type === 'MemberExpression') {
    const property = getStaticPropertyName(expression.property);
    return property === 'Service' || Boolean(property?.endsWith('Service'));
  }

  return false;
};

/** Object expression of a `.use(...)` member call, if any. */
export const getUseCallReceiver = (node: ESTree.CallExpression): ESTree.Node | undefined => {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return undefined;
  }
  if (getStaticPropertyName(callee.property) !== 'use') {
    return undefined;
  }
  return unwrapExpression(callee.object);
};

/** Options object of `new Elysia({…})`, if statically visible. */
export const getElysiaOptionsObject = (
  node: ESTree.NewExpression,
): ESTree.ObjectExpression | undefined => {
  const [first] = node.arguments;
  if (!first || first.type === 'SpreadElement') {
    return undefined;
  }
  const expression = unwrapExpression(first);
  return expression?.type === 'ObjectExpression' ? expression : undefined;
};

/** Static string value of `new Elysia({ name: "…" })`, if present. */
export const getElysiaOptionsNameLiteral = (node: ESTree.NewExpression): string | undefined => {
  const options = getElysiaOptionsObject(node);
  if (!options) {
    return undefined;
  }
  for (const property of options.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) !== 'name') {
      continue;
    }
    if (property.value.type === 'Literal' && isJsString(property.value.value)) {
      return property.value.value;
    }
    return undefined;
  }
  return undefined;
};

/** True when `new Elysia({ name: "…" })` is present. */
export const elysiaOptionsHasName = (node: ESTree.NewExpression): boolean => {
  const [first] = node.arguments;
  if (!first || first.type === 'SpreadElement') {
    // Spread options: conservatively treat as named.
    return Boolean(first && first.type === 'SpreadElement');
  }
  const expression = unwrapExpression(first);
  if (expression?.type !== 'ObjectExpression') {
    return false;
  }
  if (objectHasSpread(expression)) {
    return true;
  }
  return objectHasOwnProperty(expression, 'name');
};

/**
 * True when a CallExpression is an Elysia route method on an Elysia instance
 * chain (`new Elysia().get`, `app.post` where `app` resolves to Elysia, …).
 */
export const isElysiaRouteMethodCall = (node: ESTree.CallExpression): boolean => {
  if (!getElysiaRouteMethod(node)) {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  return isElysiaInstanceExpression(callee.object);
};

/**
 * Route-shaped Elysia call: a proven instance chain, or a typical
 * `app.get(path, handler)` form. Skips HTTP clients that pass a data
 * object in the handler slot (`axios.post(url, body)`).
 */
export const isElysiaStyleRouteCall = (node: ESTree.CallExpression): boolean => {
  if (!getElysiaRouteMethod(node)) {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  if (isElysiaInstanceExpression(callee.object)) {
    return true;
  }
  // Unknown receiver: require a `/path` string so `kv.put('key', value)` and
  // `searchParams.delete('a', 'b')` do not count as routes.
  if (!routePathArgumentStartsWithSlash(node)) {
    return false;
  }
  const handler = getElysiaRouteHandler(node);
  if (!handler) {
    return false;
  }
  return handler.type !== 'ObjectExpression';
};

/** True when the path argument is a string or template literal that starts with `/`. */
const routePathArgumentStartsWithSlash = (node: ESTree.CallExpression): boolean => {
  const argument = node.arguments[callLeafName(node) === 'route' ? 1 : 0];
  if (!argument || argument.type === 'SpreadElement') {
    return false;
  }
  const expression = resolveIdentifierInit(argument) ?? unwrapExpression(argument);
  if (expression?.type === 'Literal' && isJsString(expression.value)) {
    return expression.value.startsWith('/');
  }
  if (expression?.type === 'TemplateLiteral') {
    return expression.quasis[0]?.value.raw.startsWith('/') ?? false;
  }
  return false;
};

/** Leaf method name of an Elysia instance member call, if any. */
export const getElysiaInstanceMethodName = (node: ESTree.CallExpression): string | undefined => {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return undefined;
  }
  if (!isElysiaInstanceExpression(callee.object)) {
    return undefined;
  }
  return getStaticPropertyName(callee.property);
};

/** Methods allowed on `routes/index` mount tables. */
export const ELYSIA_ROUTES_INDEX_ALLOWED_METHODS = new Set(['use', 'as']);

/** Walk to the root `new Elysia(...)` of an instance chain, if any. */
export const getRootNewElysiaExpression = (
  node: ESTree.Node | undefined,
  seen: Set<ESTree.Node> = new Set<ESTree.Node>(),
): ESTree.NewExpression | undefined => {
  const expression = unwrapExpression(node);
  if (!expression || seen.has(expression)) {
    return undefined;
  }
  seen.add(expression);

  if (isNewElysiaExpression(expression)) {
    return expression;
  }

  if (expression.type === 'CallExpression') {
    const callee = unwrapExpression(expression.callee);
    if (callee?.type === 'MemberExpression') {
      return getRootNewElysiaExpression(callee.object, seen);
    }
    return undefined;
  }

  if (expression.type === 'Identifier') {
    const init = resolveIdentifierInit(expression);
    if (init && init !== expression) {
      return getRootNewElysiaExpression(init, seen);
    }
  }

  return undefined;
};

/** camelCase export name ending in `Route` or `Routes`. */
export const ROUTE_EXPORT_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*Routes?$/u;

export const isRouteExportName = (name: string | undefined): boolean =>
  Boolean(name && ROUTE_EXPORT_NAME_PATTERN.test(name));

/** `summaryRoute` → `SUMMARY_ROUTE` (Elysia `{ name }` stays SCREAMING). */
export const camelCaseToScreamingSnake = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** True when `node` sits under an `export` declaration. */
export const isExportedNode = (node: ESTree.Node): boolean => {
  let current: ESTree.Node | undefined = node;
  while (current) {
    if (current.type === 'ExportNamedDeclaration' || current.type === 'ExportDefaultDeclaration') {
      return true;
    }
    current = current.parent ?? undefined;
  }
  return false;
};

/** True when a chained call includes `.listen(...)`. */
export const chainIncludesListen = (node: ESTree.Node): boolean => {
  let current: ESTree.Node | undefined = node;

  while (current) {
    if (current.type === 'CallExpression') {
      const callee = unwrapExpression(current.callee);
      if (
        callee?.type === 'MemberExpression' &&
        getStaticPropertyName(callee.property) === 'listen'
      ) {
        return true;
      }
    }

    const nodeParent: ESTree.Node | undefined = current.parent ?? undefined;
    if (
      nodeParent?.type === 'MemberExpression' &&
      nodeParent.object === current &&
      nodeParent.parent?.type === 'CallExpression' &&
      nodeParent.parent.callee === nodeParent
    ) {
      current = nodeParent.parent ?? undefined;
      continue;
    }

    break;
  }

  return false;
};

/** Type name from a parameter's TS type annotation (`Context`, unions, etc.). */
function parameterTypeAnnotation(param: ESTree.Node): ESTree.Node | undefined {
  if (
    param.type === 'Identifier' ||
    param.type === 'ObjectPattern' ||
    param.type === 'ArrayPattern' ||
    param.type === 'RestElement'
  ) {
    return param.typeAnnotation?.typeAnnotation;
  }
  if (param.type === 'AssignmentPattern') {
    return parameterTypeAnnotation(param.left);
  }
  return undefined;
}

/** Local names that refer to Elysia's `Context` type in one file. */
export interface ElysiaContextBindings {
  /** Local names of `Context` imported from `elysia` (`Context`, `Ctx` for `Context as Ctx`). */
  readonly names: ReadonlySet<string>;
  /** Local names of `import * as E from 'elysia'`. */
  readonly namespaces: ReadonlySet<string>;
  /** True when `Context` is bound to something that is not Elysia (Effect, Hono, a local type). */
  readonly foreignContext: boolean;
}

const isElysiaModuleSource = (source: RuntimeScalar): boolean =>
  isJsString(source) && (source === 'elysia' || source.startsWith('elysia/'));

const declaresLocalContext = (statement: ESTree.Node | null | undefined): boolean =>
  (statement?.type === 'TSTypeAliasDeclaration' ||
    statement?.type === 'TSInterfaceDeclaration' ||
    statement?.type === 'ClassDeclaration') &&
  statement.id?.name === 'Context';

/**
 * Find which names mean Elysia `Context` in this file. An unimported `Context`
 * counts as Elysia (the file imports `elysia`), unless another import or a
 * local declaration binds `Context`.
 */
export const collectElysiaContextBindings = (program: ESTree.Program): ElysiaContextBindings => {
  const names = new Set<string>();
  const namespaces = new Set<string>();
  let foreignContext = false;

  for (const statement of program.body) {
    if (declaresLocalContext(statement)) {
      foreignContext = true;
    }
    if (
      statement.type === 'ExportNamedDeclaration' &&
      declaresLocalContext(statement.declaration)
    ) {
      foreignContext = true;
    }
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const fromElysia = isElysiaModuleSource(statement.source.value);
    for (const specifier of statement.specifiers) {
      const local = specifier.local.name;
      if (specifier.type === 'ImportNamespaceSpecifier' && fromElysia) {
        namespaces.add(local);
        continue;
      }
      if (specifier.type === 'ImportSpecifier' && fromElysia) {
        const imported = getStaticPropertyName(specifier.imported);
        if (imported === 'Context') {
          names.add(local);
        }
        continue;
      }
      if (local === 'Context') {
        foreignContext = true;
      }
    }
  }

  if (!foreignContext) {
    names.add('Context');
  }
  return { names, namespaces, foreignContext };
};

/** True when a TS type node names Elysia `Context` (direct, aliased, namespaced, or `import('elysia')`). */
const isElysiaContextTypeNode = (
  annotation: ESTree.Node,
  bindings: ElysiaContextBindings,
): boolean => {
  if (annotation.type === 'TSTypeReference') {
    const { typeName } = annotation;
    if (typeName.type === 'Identifier') {
      return bindings.names.has(typeName.name);
    }
    if (typeName.type === 'TSQualifiedName') {
      return (
        typeName.right.name === 'Context' &&
        typeName.left.type === 'Identifier' &&
        bindings.namespaces.has(typeName.left.name)
      );
    }
    return false;
  }
  if (annotation.type === 'TSImportType') {
    return (
      isElysiaModuleSource(annotation.source.value) &&
      annotation.qualifier?.type === 'Identifier' &&
      annotation.qualifier.name === 'Context'
    );
  }
  if (annotation.type === 'TSUnionType' || annotation.type === 'TSIntersectionType') {
    return annotation.types.some((part) => isElysiaContextTypeNode(part, bindings));
  }
  if (annotation.type === 'TSParenthesizedType') {
    return isElysiaContextTypeNode(annotation.typeAnnotation, bindings);
  }
  return false;
};

/** True when a parameter is typed as Elysia `Context`. */
export const isElysiaContextParam = (
  param: ESTree.Node,
  bindings: ElysiaContextBindings,
): boolean => {
  const annotation = parameterTypeAnnotation(param);
  return annotation !== undefined && isElysiaContextTypeNode(annotation, bindings);
};

/** Route handler expression (usually 2nd arg, or 3rd for `.route`). */
export const getElysiaRouteHandler = (node: ESTree.CallExpression): ESTree.Node | undefined => {
  const leaf = callLeafName(node);
  if (!leaf || !isElysiaRouteMethod(leaf)) {
    return undefined;
  }

  const handlerIndex = leaf === 'route' ? 2 : 1;
  const argument = node.arguments[handlerIndex];
  if (!argument || argument.type === 'SpreadElement') {
    return undefined;
  }
  return resolveIdentifierInit(argument) ?? unwrapExpression(argument);
};

const isLifecycleMethodCall = (node: ESTree.CallExpression): boolean => {
  const leaf = callLeafName(node);
  return Boolean(leaf && ELYSIA_LIFECYCLE_METHODS.has(leaf));
};

/** True when a lifecycle callback argument references the handler node. */
const lifecycleArgumentMatchesHandler = (
  argument: ESTree.Node | ESTree.SpreadElement,
  handler: ESTree.Node,
): boolean => {
  if (argument.type === 'SpreadElement') {
    return false;
  }
  return unwrapExpression(argument) === handler || resolveIdentifierInit(argument) === handler;
};

/**
 * True when `node` is nested inside an Elysia route handler or lifecycle hook.
 */
export const isInsideElysiaHandlerContext = (node: ESTree.Node): boolean => {
  let current: ESTree.Node | undefined = node.parent ?? undefined;

  while (current) {
    if (!isFunctionLike(current)) {
      current = current.parent ?? undefined;
      continue;
    }

    const { parent } = current;
    const handlerNode = current;

    // app.get('/', fn) / app.get('/', handlerIdent resolved)
    if (parent?.type === 'CallExpression') {
      const handler = getElysiaRouteHandler(parent);
      if (handler === handlerNode) {
        return true;
      }
      // .onBeforeHandle(fn) / .derive(fn)
      if (
        isLifecycleMethodCall(parent) &&
        parent.arguments.some((argument) => lifecycleArgumentMatchesHandler(argument, handlerNode))
      ) {
        return true;
      }
    }

    // Hook object: { beforeHandle: fn }
    if (
      parent?.type === 'Property' &&
      !parent.computed &&
      ROUTE_LIFECYCLE_HOOK_KEYS.has(getStaticPropertyName(parent.key) ?? '') &&
      parent.value === handlerNode
    ) {
      return true;
    }

    // const handler = () => …; app.get('/', handler)
    if (isFunctionReferencedAsElysiaHandler(handlerNode)) {
      return true;
    }

    current = current.parent ?? undefined;
  }

  return false;
};

/**
 * Cookie jar member that is not `.value`
 * (`cookie.session`, `cookie?.session`, `cookie['session']`).
 */
export const isCookieJarMember = (node: ESTree.Node | undefined): boolean => {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'MemberExpression') {
    return false;
  }

  let property: string | undefined = undefined;
  if (expression.computed) {
    if (expression.property.type === 'Literal' && isJsString(expression.property.value)) {
      property = expression.property.value;
    }
  } else {
    property = getStaticPropertyName(expression.property);
  }

  if (!property || property === 'value') {
    return false;
  }

  const object = unwrapExpression(expression.object);
  return object?.type === 'Identifier' && object.name === 'cookie';
};

/**
 * Elysia `StatusMap` (elysia 1.4.30 `dist/utils.mjs`). `status('Not Found')` is
 * the same as `status(404)`.
 */
export const ELYSIA_STATUS_CODES: ReadonlyMap<string, number> = new Map([
  ['Continue', 100],
  ['Switching Protocols', 101],
  ['Processing', 102],
  ['Early Hints', 103],
  ['OK', 200],
  ['Created', 201],
  ['Accepted', 202],
  ['Non-Authoritative Information', 203],
  ['No Content', 204],
  ['Reset Content', 205],
  ['Partial Content', 206],
  ['Multi-Status', 207],
  ['Already Reported', 208],
  ['Multiple Choices', 300],
  ['Moved Permanently', 301],
  ['Found', 302],
  ['See Other', 303],
  ['Not Modified', 304],
  ['Temporary Redirect', 307],
  ['Permanent Redirect', 308],
  ['Bad Request', 400],
  ['Unauthorized', 401],
  ['Payment Required', 402],
  ['Forbidden', 403],
  ['Not Found', 404],
  ['Method Not Allowed', 405],
  ['Not Acceptable', 406],
  ['Proxy Authentication Required', 407],
  ['Request Timeout', 408],
  ['Conflict', 409],
  ['Gone', 410],
  ['Length Required', 411],
  ['Precondition Failed', 412],
  ['Payload Too Large', 413],
  ['URI Too Long', 414],
  ['Unsupported Media Type', 415],
  ['Range Not Satisfiable', 416],
  ['Expectation Failed', 417],
  ["I'm a teapot", 418],
  ['Enhance Your Calm', 420],
  ['Misdirected Request', 421],
  ['Unprocessable Content', 422],
  ['Locked', 423],
  ['Failed Dependency', 424],
  ['Too Early', 425],
  ['Upgrade Required', 426],
  ['Precondition Required', 428],
  ['Too Many Requests', 429],
  ['Request Header Fields Too Large', 431],
  ['Unavailable For Legal Reasons', 451],
  ['Internal Server Error', 500],
  ['Not Implemented', 501],
  ['Bad Gateway', 502],
  ['Service Unavailable', 503],
  ['Gateway Timeout', 504],
  ['HTTP Version Not Supported', 505],
  ['Variant Also Negotiates', 506],
  ['Insufficient Storage', 507],
  ['Loop Detected', 508],
  ['Not Extended', 510],
  ['Network Authentication Required', 511],
]);

/** Numeric status of a `status(code, …)` argument: a number literal or a `StatusMap` name. */
export const getStaticStatusCode = (
  node: ESTree.Node | ESTree.SpreadElement | undefined,
): number | undefined => {
  if (!node || node.type === 'SpreadElement') {
    return undefined;
  }
  const code = unwrapExpression(node);
  if (code?.type !== 'Literal') {
    return undefined;
  }
  if (isJsNumber(code.value)) {
    return code.value;
  }
  if (isJsString(code.value)) {
    return ELYSIA_STATUS_CODES.get(code.value);
  }
  return undefined;
};

/** True when the callee is the bare identifier `name` (not `a.b.name`). */
const isBareIdentifierCall = (node: ESTree.CallExpression, name: string): boolean => {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && callee.name === name;
};

/** True when expression is an Elysia `status(...)` call (not `res.status` / `a.b.status`). */
export const isElysiaStatusCall = (node: ESTree.CallExpression): boolean =>
  isBareIdentifierCall(node, 'status');

/** True when expression is an Elysia `redirect(...)` call (not `a.b.redirect`). */
export const isElysiaRedirectCall = (node: ESTree.CallExpression): boolean =>
  isBareIdentifierCall(node, 'redirect');

/** Depth-first walk; stops when `predicate` returns true. */
export const subtreeMatches = (
  node: ESTree.Node | undefined,
  predicate: (current: ESTree.Node) => boolean,
): boolean => {
  if (!node) {
    return false;
  }

  let found = false;

  /** Walk a subtree until `predicate` matches. */
  const visit = (current: ESTree.Node) => {
    if (found) {
      return;
    }
    if (predicate(current)) {
      found = true;
      return;
    }
    visitAstChildren(current, visit);
  };

  visit(node);
  return found;
};

/** Walk a subtree for `new Elysia(...)`. */
export const subtreeCreatesElysia = (node: ESTree.Node | undefined): boolean =>
  subtreeMatches(node, (current) => isNewElysiaExpression(current));

/** Walk a subtree for Elysia `status(...)` calls. */
export const subtreeUsesElysiaStatus = (node: ESTree.Node | undefined): boolean =>
  subtreeMatches(
    node,
    (current) => current.type === 'CallExpression' && isElysiaStatusCall(current),
  );

/** Walk a subtree for Elysia `redirect(...)` calls. */
export const subtreeUsesElysiaRedirect = (node: ESTree.Node | undefined): boolean =>
  subtreeMatches(
    node,
    (current) => current.type === 'CallExpression' && isElysiaRedirectCall(current),
  );

/**
 * Static route path string from `app.get("/path", …)` / `app.route("GET", "/path", …)`.
 */
export const getElysiaRoutePath = (node: ESTree.CallExpression): string | undefined => {
  const leaf = callLeafName(node);
  if (!leaf || !isElysiaRouteMethod(leaf)) {
    return undefined;
  }

  const pathIndex = leaf === 'route' ? 1 : 0;
  const argument = node.arguments[pathIndex];
  if (!argument || argument.type === 'SpreadElement') {
    return undefined;
  }

  const expression = resolveIdentifierInit(argument) ?? unwrapExpression(argument);
  if (expression?.type === 'Literal' && isJsString(expression.value)) {
    return expression.value;
  }
  return undefined;
};

/** True when an Elysia path declares a `:param` segment (e.g. `"/:id"`). */
export const routePathHasParams = (path: string): boolean => /:[A-Za-z_]\w*/u.test(path);

/**
 * Top-level property names destructured from a handler's first parameter
 * (`({ query, params }) => …`).
 */
export const getHandlerDestructuredPropNames = (
  handler: ESTree.Node | undefined,
): ReadonlySet<string> => {
  if (!handler || !isFunctionLike(handler)) {
    return new Set();
  }

  const [first] = handler.params;
  if (!first) {
    return new Set();
  }

  let pattern: ESTree.Node = first;
  if (pattern.type === 'AssignmentPattern') {
    pattern = pattern.left;
  }
  if (pattern.type !== 'ObjectPattern') {
    return new Set();
  }

  const names = new Set<string>();
  for (const property of pattern.properties) {
    if (property.type !== 'Property' || property.computed) {
      continue;
    }
    const name = getStaticPropertyName(property.key);
    if (name) {
      names.add(name);
    }
  }
  return names;
};

/** True when a hook object declares `key` (spreads count as satisfied). */
export const routeHookHasSchemaKey = (
  hook: ESTree.ObjectExpression | undefined,
  key: string,
): boolean => {
  if (!hook) {
    return false;
  }
  if (objectHasSpread(hook)) {
    return true;
  }
  return objectHasOwnProperty(hook, key);
};

/**
 * True when the route hook or an enclosing `.guard()` / `.group()` schema
 * declares `key`.
 */
export const routeOrGuardHasSchemaKey = (node: ESTree.CallExpression, key: string): boolean =>
  routeHookHasSchemaKey(getElysiaRouteHookObject(node), key) ||
  getApplicableGuardHooks(node).some((hook) => routeHookHasSchemaKey(hook, key));

/** True when the route hook or an applicable guard/group declares any schema key. */
export const routeOrGuardHasSchema = (node: ESTree.CallExpression): boolean =>
  routeHookHasSchema(getElysiaRouteHookObject(node)) ||
  getApplicableGuardHooks(node).some((hook) => routeHookHasSchema(hook));

/** Same-object property node, if it is a static key. */
export const getObjectProperty = (
  node: ESTree.ObjectExpression,
  propertyName: string,
): ESTree.ObjectProperty | undefined => {
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) === propertyName) {
      return property;
    }
  }
  return undefined;
};

/** Value of a same-object property, if it is a static key. */
export const getObjectPropertyValue = (
  node: ESTree.ObjectExpression,
  propertyName: string,
): ESTree.Node | undefined => {
  const property = getObjectProperty(node, propertyName);
  if (!property) {
    return undefined;
  }
  return unwrapExpression(property.value);
};

/** Auth-ish keys returned from derive/resolve callbacks. */
const AUTH_RETURN_KEYS = new Set(['user', 'session', 'auth']);

/**
 * True when `error` is a string Literal, or an Identifier that same-file-resolves
 * to a string Literal VariableDeclarator init.
 */
export const isStringLiteralOrConstString = (node: ESTree.Node | undefined): boolean => {
  const expression = unwrapExpression(node);
  if (!expression) {
    return false;
  }
  if (expression.type === 'Literal' && isJsString(expression.value)) {
    return true;
  }
  if (expression.type === 'Identifier') {
    const init = resolveIdentifierInit(expression);
    return Boolean(init && init.type === 'Literal' && isJsString(init.value));
  }
  return false;
};

/** Collect static property keys from returned object literals in a function. */
const collectReturnedObjectKeys = (fn: ESTree.Node): Set<string> => {
  const keys = new Set<string>();

  const addObjectKeys = (object: ESTree.ObjectExpression) => {
    for (const property of object.properties) {
      if (property.type === 'SpreadElement') {
        continue;
      }
      const name = getStaticPropertyName(property.key);
      if (name) {
        keys.add(name);
      }
    }
  };

  /** Walk for return / arrow-expression object literals. */
  const visit = (current: ESTree.Node) => {
    if (current.type === 'ReturnStatement' && current.argument) {
      const argument = unwrapExpression(current.argument);
      if (argument?.type === 'ObjectExpression') {
        addObjectKeys(argument);
      }
    }
    if (
      current.type === 'ArrowFunctionExpression' &&
      current === fn &&
      current.expression &&
      current.body.type !== 'BlockStatement'
    ) {
      const body = unwrapExpression(current.body);
      if (body?.type === 'ObjectExpression') {
        addObjectKeys(body);
      }
    }
    visitAstChildren(current, visit);
  };

  visit(fn);
  return keys;
};

/** True when subtree mentions cookie / authorization / jwt auth patterns. */
const subtreeMentionsAuthPattern = (node: ESTree.Node): boolean => {
  let found = false;

  /** Depth-first auth-pattern scan. */
  const visit = (current: ESTree.Node) => {
    if (found) {
      return;
    }

    if (current.type === 'Identifier') {
      const { name } = current;
      if (name === 'cookie' || name === 'jwt' || name === 'authorization') {
        found = true;
        return;
      }
    }

    if (current.type === 'Literal' && isJsString(current.value)) {
      const value = current.value.toLowerCase();
      if (value === 'authorization' || value === 'cookie' || value === 'jwt') {
        found = true;
        return;
      }
    }

    if (current.type === 'MemberExpression') {
      const property = getStaticPropertyName(current.property);
      const object = unwrapExpression(current.object);
      if (
        property === 'authorization' ||
        property === 'cookie' ||
        property === 'jwt' ||
        (object?.type === 'Identifier' && object.name === 'cookie')
      ) {
        found = true;
        return;
      }
    }

    visitAstChildren(current, visit);
  };

  visit(node);
  return found;
};

/**
 * Heuristic: derive callback looks like session/auth (cookie, Authorization,
 * jwt, or returns `user`/`session`/`auth`). IP-only derives are excluded.
 */
export const isAuthRelatedDeriveCallback = (fn: ESTree.Node | undefined): boolean => {
  if (!fn || !isFunctionLike(fn)) {
    return false;
  }

  const returnedKeys = collectReturnedObjectKeys(fn);
  const returnsOnlyIp = returnedKeys.size > 0 && [...returnedKeys].every((key) => key === 'ip');
  if (returnsOnlyIp) {
    return false;
  }

  for (const key of returnedKeys) {
    if (AUTH_RETURN_KEYS.has(key)) {
      return true;
    }
  }

  for (const param of fn.params) {
    if (subtreeMentionsAuthPattern(param)) {
      return true;
    }
  }

  if (fn.body === null || fn.body === undefined) {
    return false;
  }
  return subtreeMentionsAuthPattern(fn.body);
};

/**
 * Callback argument of `.derive(...)` / `.derive({ as }, fn)` on an Elysia
 * instance, if any.
 */
export const getElysiaDeriveCallback = (node: ESTree.CallExpression): ESTree.Node | undefined => {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return undefined;
  }
  if (getStaticPropertyName(callee.property) !== 'derive') {
    return undefined;
  }
  if (!isElysiaInstanceExpression(callee.object)) {
    return undefined;
  }

  for (let index = node.arguments.length - 1; index >= 0; index -= 1) {
    const argument = node.arguments[index];
    if (!argument || argument.type === 'SpreadElement') {
      continue;
    }
    const expression = unwrapExpression(argument);
    if (isFunctionLike(expression)) {
      return expression;
    }
    const resolved = resolveIdentifierInit(argument);
    if (resolved && isFunctionLike(resolved)) {
      return resolved;
    }
  }
  return undefined;
};
