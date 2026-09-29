import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  calleeNamespaceMember,
  collectRouterEdgeBindings,
  collectRouterImportNames,
  getAppliedRouteOptions,
  importedModuleName,
  isControlFlowNotFoundCall,
  isControlFlowRedirectCall,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { isRouteLifecycleFunction } from '../route.ts';
import {
  getJsxComponentName,
  getNavOptionObjects,
  getObjectPropValue,
  isRouterNavCall,
  isRouterNavJsx,
  jsxHasAttr,
  resolveIdentifierInit,
  TANSTACK_ROUTER_MODULES,
} from '../router.ts';

const ROUTER_MODULE_SET = new Set<string>(TANSTACK_ROUTER_MODULES);

/**
 * Each entry is `@deprecated` in the installed `.d.ts` of `@tanstack/react-router` 1.170.36,
 * `@tanstack/router-core` 1.171.30, or `@tanstack/start-client-core` 1.170.30.
 * `new Router()` is not here: the React `Router` class redeclares its constructor without the tag.
 */
const DEPRECATED_IMPORTS = new Map([
  ['rootRouteWithContext', '`createRootRouteWithContext`'],
  ['FileRouteLoader', 'a `loader` in the `createFileRoute` options of the same file'],
  ['ScrollRestoration', 'the `scrollRestoration` option on `createRouter`'],
  ['ErrorRouteProps', 'the `ErrorComponentProps` type'],
]);

const DEPRECATED_CONSTRUCTORS = new Map([
  ['RouteApi', '`getRouteApi("/route/id")`'],
  ['Route', '`createRoute({ ... })`'],
  ['RootRoute', '`createRootRoute({ ... })`'],
  ['FileRoute', '`createFileRoute("/path")({ ... })`'],
]);

const DEPRECATED_ROUTE_OPTIONS = new Map([
  ['parseParams', '`params: { parse }`'],
  ['stringifyParams', '`params: { stringify }`'],
  ['preSearchFilters', '`search: { middlewares }`'],
  ['postSearchFilters', '`search: { middlewares }`'],
]);

const START_CHAIN_FACTORIES = new Set(['createServerFn', 'createMiddleware']);

/** The key node of `name` in an object literal, for the report location. */
function hasKey(node: ESTree.Node | undefined, name: string): ESTree.Node | undefined {
  const value = getObjectPropValue(node, name);
  const property = value?.parent;
  return property?.type === 'Property' ? property.key : undefined;
}

function firstArgument(
  node: ESTree.CallExpression | ESTree.NewExpression,
): ESTree.Node | undefined {
  const first = node.arguments[0];
  return first === undefined || first.type === 'SpreadElement' ? undefined : first;
}

/** Name of a router import that `callee` refers to: `Name` or `Namespace.Name`. */
function routerCalleeName(
  node: ESTree.CallExpression | ESTree.NewExpression,
  imports: ReadonlyMap<string, string>,
  bindings: RouterEdgeBindings,
): string | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    return imports.get(callee.name);
  }
  return calleeNamespaceMember(node, bindings.namespaces);
}

/** `createServerFn(...).a().b()` or a variable that holds such a chain. */
function isStartChain(
  node: ESTree.Expression | undefined,
  imports: ReadonlyMap<string, string>,
  bindings: RouterEdgeBindings,
  depth = 0,
): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined || depth > 20) {
    return false;
  }
  if (expression.type === 'Identifier') {
    const init = resolveIdentifierInit(expression);
    return init !== expression && isStartChain(init, imports, bindings, depth + 1);
  }
  if (expression.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(expression.callee);
  if (callee?.type === 'Identifier') {
    const name = imports.get(callee.name);
    return name !== undefined && START_CHAIN_FACTORIES.has(name);
  }
  const member = calleeNamespaceMember(expression, bindings.namespaces);
  if (member !== undefined) {
    return START_CHAIN_FACTORIES.has(member);
  }
  return (
    callee?.type === 'MemberExpression' && isStartChain(callee.object, imports, bindings, depth + 1)
  );
}

function isLifecycleContextParam(object: ESTree.Expression, fnNode: ESTree.Node): boolean {
  const expression = unwrapExpression(object);
  if (expression?.type !== 'Identifier' || !isFunctionLike(fnNode)) {
    return false;
  }
  const param = fnNode.params[0];
  return param?.type === 'Identifier' && param.name === expression.name;
}

/** Nearest function that declares `name` as a parameter. */
function functionDeclaringParam(node: ESTree.Node, name: string): ESTree.Node | undefined {
  let current = node.parent ?? undefined;
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      const declares = current.params.some(
        (param) => param.type === 'Identifier' && param.name === name,
      );
      if (declares) {
        return current;
      }
    }
    current = current.parent ?? undefined;
  }
  return undefined;
}

export const noDeprecatedApisName = bnRuleName('no-deprecated-apis');

export const noDeprecatedApis: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TanStack Router and Start APIs that are marked `@deprecated`',
    },
    messages: {
      deprecated: agentDiagnostic({
        problem: '`{{name}}` is deprecated in TanStack Router or TanStack Start.',
        why: 'Deprecated APIs can be removed in the next major version. The current API gets fixes and types first.',
        fix: 'Use {{replacement}}.',
        avoid: 'Do not keep the old API behind an alias or a wrapper. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;
    let imports: ReadonlyMap<string, string>;

    function report(node: ESTree.Node, name: string, replacement: string): void {
      context.report({ messageId: 'deprecated', node, data: { name, replacement } });
    }

    function reportRouteOptions(node: ESTree.CallExpression): void {
      const applied = getAppliedRouteOptions(node, bindings);
      if (applied === undefined) {
        return;
      }
      for (const [option, replacement] of DEPRECATED_ROUTE_OPTIONS) {
        const key = hasKey(applied.argument, option);
        if (key !== undefined) {
          report(key, option, replacement);
        }
      }
    }

    function reportNavigationOptions(node: ESTree.CallExpression): void {
      if (!isRouterNavCall(node)) {
        return;
      }
      for (const options of getNavOptionObjects(firstArgument(node))) {
        const key = hasKey(options, 'startTransition');
        if (key !== undefined) {
          report(key, 'startTransition', 'no option: every navigation uses a transition now');
        }
      }
    }

    function reportUseBlocker(node: ESTree.CallExpression): void {
      if (routerCalleeName(node, imports, bindings) !== 'useBlocker') {
        return;
      }
      const first = firstArgument(node);
      const legacyFunction = first !== undefined && isFunctionLike(first);
      const legacyKey = hasKey(first, 'blockerFn') ?? hasKey(first, 'condition');
      if (legacyFunction || node.arguments.length > 1 || legacyKey !== undefined) {
        report(node, 'useBlocker(blockerFn, condition)', '`useBlocker({ shouldBlockFn })`');
      }
    }

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectRouterEdgeBindings(program);
        imports = collectRouterImportNames(program);
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!isJsString(source) || !ROUTER_MODULE_SET.has(source)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue;
          }
          const name = importedModuleName(specifier);
          const replacement = name === undefined ? undefined : DEPRECATED_IMPORTS.get(name);
          if (name !== undefined && replacement !== undefined) {
            report(specifier, name, replacement);
          }
        }
      },
      NewExpression(node) {
        const name = routerCalleeName(node, imports, bindings);
        const replacement = name === undefined ? undefined : DEPRECATED_CONSTRUCTORS.get(name);
        if (name !== undefined && replacement !== undefined) {
          report(node, `new ${name}()`, replacement);
        }
      },
      CallExpression(node) {
        if (isControlFlowRedirectCall(node, bindings)) {
          const key = hasKey(firstArgument(node), 'code');
          if (key !== undefined) {
            report(key, 'redirect({ code })', '`redirect({ statusCode })`');
          }
        }
        if (isControlFlowNotFoundCall(node, bindings)) {
          const key = hasKey(firstArgument(node), 'global');
          if (key !== undefined) {
            report(
              key,
              'notFound({ global })',
              '`notFound({ routeId: rootRouteId })`. Import `rootRouteId` from the router package',
            );
          }
        }
        reportRouteOptions(node);
        reportNavigationOptions(node);
        reportUseBlocker(node);
        const callee = unwrapExpression(node.callee);
        if (
          callee?.type === 'MemberExpression' &&
          getStaticPropertyName(callee.property) === 'inputValidator' &&
          isStartChain(callee.object, imports, bindings)
        ) {
          report(callee.property, '.inputValidator()', '`.validator()` with the same argument');
        }
      },
      JSXOpeningElement(node) {
        if (isRouterNavJsx(node) && jsxHasAttr(node, 'startTransition')) {
          report(node, 'startTransition', 'no prop: every navigation uses a transition now');
        }
        const name = getJsxComponentName(node);
        if (name !== undefined && imports.get(name) === 'Block') {
          for (const legacy of ['blockerFn', 'condition']) {
            if (jsxHasAttr(node, legacy)) {
              report(node, `<Block ${legacy}>`, '`<Block shouldBlockFn={...}>`');
            }
          }
        }
      },
      MemberExpression(node) {
        if (getStaticPropertyName(node.property) !== 'navigate' || node.computed) {
          return;
        }
        const object = unwrapExpression(node.object);
        if (object?.type !== 'Identifier') {
          return;
        }
        const fn = functionDeclaringParam(node, object.name);
        if (
          fn !== undefined &&
          isRouteLifecycleFunction(fn) &&
          isLifecycleContextParam(object, fn)
        ) {
          report(node.property, 'navigate', '`throw redirect({ to: "/path" })`');
        }
      },
      Property(node) {
        if (
          getStaticPropertyName(node.key) !== 'navigate' ||
          node.parent.type !== 'ObjectPattern'
        ) {
          return;
        }
        const pattern = node.parent;
        const holder = pattern.parent ?? undefined;
        const fn = holder?.type === 'AssignmentPattern' ? (holder.parent ?? undefined) : holder;
        if (fn === undefined || !isFunctionLike(fn) || !isRouteLifecycleFunction(fn)) {
          return;
        }
        const param = fn.params[0];
        if (param === pattern || (param?.type === 'AssignmentPattern' && param === holder)) {
          report(node.key, 'navigate', '`throw redirect({ to: "/path" })`');
        }
      },
    };
  },
});
