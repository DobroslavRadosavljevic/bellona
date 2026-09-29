import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  ELYSIA_ROUTE_METHODS,
  getObjectPropertyValue,
  isNewElysiaExpression,
  subtreeMatches,
} from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Local hooks that Elysia applies only to routes registered after them.
 * `onError`, `onRequest`, `onAfterResponse`, and `mapResponse` are not listed:
 * the app-wide request and error handlers (not-found, errors before routing)
 * also use them, so a late one still runs (elysia 1.4.30 `compose.mjs`).
 *
 * @see https://elysiajs.com/essential/life-cycle.html#order-of-code
 */
const ORDERED_HOOK_METHODS = new Set([
  'onBeforeHandle',
  'onAfterHandle',
  'onTransform',
  'onParse',
  'derive',
  'resolve',
  'mapDerive',
  'mapResolve',
]);

/** Chain calls that add routes, directly or through a plugin / group. */
const isRouteRegisteringCall = (method: string, call: ESTree.CallExpression): boolean => {
  if (ELYSIA_ROUTE_METHODS.has(method)) {
    return true;
  }
  if (method === 'ws' || method === 'use' || method === 'group' || method === 'mount') {
    return true;
  }
  // `.guard(hook, (app) => …)` registers routes. `.guard(hook)` alone does not.
  return method === 'guard' && call.arguments.length >= 2;
};

interface ChainCall {
  readonly method: string;
  readonly call: ESTree.CallExpression;
}

/** Wrappers that keep the chain value (`(x)`, `x!`, `x as T`, `x satisfies T`). */
const isChainWrapper = (node: ESTree.Node): boolean =>
  node.type === 'ParenthesizedExpression' ||
  node.type === 'TSNonNullExpression' ||
  node.type === 'TSAsExpression' ||
  node.type === 'TSSatisfiesExpression';

/** Calls chained on a `new Elysia()` root, in order, and the outermost chain expression. */
interface ElysiaChain {
  readonly calls: ChainCall[];
  readonly outer: ESTree.Node;
}

/** Method calls chained on `root`, in order, plus the outermost chain expression. */
const collectChain = (root: ESTree.Node): ElysiaChain => {
  const calls: ChainCall[] = [];
  let current: ESTree.Node = root;
  for (;;) {
    const parent: ESTree.Node | undefined = current.parent ?? undefined;
    if (!parent) {
      break;
    }
    if (isChainWrapper(parent)) {
      current = parent;
      continue;
    }
    const call = parent.parent;
    if (
      parent.type === 'MemberExpression' &&
      parent.object === current &&
      call?.type === 'CallExpression' &&
      call.callee === parent
    ) {
      calls.push({ method: getStaticPropertyName(parent.property) ?? '', call });
      current = call;
      continue;
    }
    break;
  }
  return { calls, outer: current };
};

/**
 * True when the hook options lift it to parent routes (`{ as: 'scoped' }` /
 * `{ as: 'global' }`) or the options are not static (unknown scope).
 */
const hookHasWiderScope = (call: ESTree.CallExpression): boolean => {
  const [first] = call.arguments;
  if (!first || first.type === 'SpreadElement' || call.arguments.length < 2) {
    return false;
  }
  const options = unwrapExpression(first);
  if (isFunctionLike(options)) {
    return false;
  }
  if (options?.type !== 'ObjectExpression') {
    return true;
  }
  const scope = getObjectPropertyValue(options, 'as');
  if (scope === undefined) {
    return false;
  }
  return !(scope.type === 'Literal' && isJsString(scope.value) && scope.value === 'local');
};

/** True when `name` is later used as `name.get(…)` / `name.use(…)` / … in the file. */
const bindingRegistersMoreRoutes = (program: ESTree.Program, name: string): boolean =>
  subtreeMatches(program, (node) => {
    if (node.type !== 'CallExpression') {
      return false;
    }
    const callee = unwrapExpression(node.callee);
    if (callee?.type !== 'MemberExpression') {
      return false;
    }
    const object = unwrapExpression(callee.object);
    const method = getStaticPropertyName(callee.property);
    return (
      object?.type === 'Identifier' &&
      object.name === name &&
      method !== undefined &&
      (isRouteRegisteringCall(method, node) || method === 'as')
    );
  });

/** Index of the last route-registering call (`lib` is ES2022: no `findLastIndex`). */
const lastRouteCallIndex = (calls: readonly ChainCall[]): number => {
  for (let index = calls.length - 1; index >= 0; index -= 1) {
    const entry = calls[index];
    if (entry && isRouteRegisteringCall(entry.method, entry.call)) {
      return index;
    }
  }
  return -1;
};

/**
 * Report a local lifecycle hook that comes after the last route in a
 * `new Elysia()` chain. Elysia applies a local hook only to routes registered
 * after it, so such a hook runs for no route.
 */
export const hookAfterRoutesName = bnRuleName('hook-after-routes');

export const hookAfterRoutes: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      NewExpression(node) {
        if (!isNewElysiaExpression(node)) {
          return;
        }
        const { calls, outer } = collectChain(node);
        const lastRouteIndex = lastRouteCallIndex(calls);
        if (lastRouteIndex < 0) {
          return;
        }
        const later = calls.slice(lastRouteIndex + 1);
        // `.as('scoped' | 'global')` lifts earlier local hooks to the parent.
        if (later.some(({ method }) => method === 'as')) {
          return;
        }
        const hooks = later.filter(
          ({ method, call }) => ORDERED_HOOK_METHODS.has(method) && !hookHasWiderScope(call),
        );
        if (hooks.length === 0) {
          return;
        }
        const declarator = outer.parent;
        if (
          declarator?.type === 'VariableDeclarator' &&
          declarator.id.type === 'Identifier' &&
          bindingRegistersMoreRoutes(context.sourceCode.ast, declarator.id.name)
        ) {
          return;
        }
        for (const { method, call } of hooks) {
          const callee = unwrapExpression(call.callee);
          const reportNode = callee?.type === 'MemberExpression' ? callee.property : call;
          context.report({ messageId: 'hookAfterRoutes', data: { method }, node: reportNode });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow local lifecycle hooks after the last route of a new Elysia() chain (they apply to no route)',
    },
    messages: {
      hookAfterRoutes: agentDiagnostic({
        problem:
          '`.{{method}}()` comes after the last route in this `new Elysia()` chain. No route is registered after it.',
        why: 'Elysia applies a local hook only to routes registered after the hook. This hook runs for no route.',
        fix: 'Move `.{{method}}()` before the routes (and `.use(…)` plugins) it must cover. For a hook meant for the parent app, pass `{ as: "scoped" }` or `{ as: "global" }` as the first argument.',
        avoid: 'Do not add a dummy route after the hook. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
