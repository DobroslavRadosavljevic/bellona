import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { ROUTER_HOOK_NAMES, TANSTACK_ROUTER_MODULES } from '../router.ts';

const BOUND_API_NAMES = new Set(['Route', 'routeApi']);

const BOUND_HOOK_NAMES = new Set([...ROUTER_HOOK_NAMES, 'useLoaderDeps', 'useMatch']);

const ROUTER_MODULE_SET = new Set<string>(TANSTACK_ROUTER_MODULES);

function isGetRouteApiCall(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && callee.name === 'getRouteApi';
}

function isBoundRouteHookCall(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  const hookName = getStaticPropertyName(callee.property);
  if (hookName === undefined || !BOUND_HOOK_NAMES.has(hookName)) {
    return false;
  }
  const object = unwrapExpression(callee.object);
  if (object === undefined) {
    return false;
  }
  if (object.type === 'Identifier' && BOUND_API_NAMES.has(object.name)) {
    return true;
  }
  return object.type === 'CallExpression' && isGetRouteApiCall(object);
}

export const noGetRouteApiName = bnRuleName('no-get-route-api');

export const noGetRouteApi: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow getRouteApi and Route.useX() / routeApi.useX(); use hooks with `from`',
    },
    messages: {
      getRouteApi: agentDiagnostic({
        problem:
          'This code calls `getRouteApi`. That helper binds hooks to a route behind a runtime id.',
        why: 'Bound APIs hide the `from` literal. Shared components then lose typed `params` / loader data, or they couple to one route.',
        fix: 'Call the hook with a route id: `useLoaderData({ from: "/posts/$postId" })` (same for `useParams` / `useSearch` / `useRouteContext`). For shared UI, pass `{ strict: false }` or pass data as props.',
        avoid:
          'Do not wrap `getRouteApi` in a local helper. Do not switch to `Route.useLoaderData()` (also banned). Do not disable the rule.',
      }),
      boundHook: agentDiagnostic({
        problem: 'This code uses a bound route hook (`Route.useX()` or `routeApi.useX()`).',
        why: 'Bound hooks skip an explicit `from` literal, so inference and reuse suffer the same way as `getRouteApi`.',
        fix: 'Call the exported hook with `from`: `useLoaderData({ from: "/posts/$postId" })`. For shared components use `{ strict: false }` or props.',
        avoid: 'Do not assign `const useData = Route.useLoaderData`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!isJsString(source) || !ROUTER_MODULE_SET.has(source)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'getRouteApi'
          ) {
            context.report({ messageId: 'getRouteApi', node: specifier });
          }
        }
      },
      CallExpression(node) {
        if (isGetRouteApiCall(node)) {
          context.report({ messageId: 'getRouteApi', node });
          return;
        }
        if (isBoundRouteHookCall(node)) {
          context.report({ messageId: 'boundHook', node });
        }
      },
    };
  },
});
