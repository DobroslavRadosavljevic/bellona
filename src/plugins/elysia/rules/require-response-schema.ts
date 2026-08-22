import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isFunctionLike } from '../ast.ts';
import {
  getElysiaRouteHandler,
  getElysiaRouteHookObject,
  getElysiaRouteMethod,
  objectHasOwnProperty,
  objectHasSpread,
  routeHookResponseHasRedirectStatus,
  subtreeUsesElysiaRedirect,
  subtreeUsesElysiaStatus,
} from '../elysia.ts';
import { shouldSkipElysiaFile } from '../options.ts';

/** True when the route hook declares `response` (spreads count as satisfied). */
const hookHasResponse = (hook: ESTree.ObjectExpression | undefined): boolean => {
  if (!hook) {
    return false;
  }
  if (objectHasSpread(hook)) {
    return true;
  }
  return objectHasOwnProperty(hook, 'response');
};

/**
 * Require a `response` schema on Elysia route hooks.
 * Default: all routes. Also flags handlers that use `status()` / `redirect()`
 * when `requireAllRoutes` is false, and redirects missing redirect status keys.
 */
export const requireResponseSchemaName = vmRuleName('require-response-schema');

export const requireResponseSchema: CreateOnceRule = defineVamanaRule({
  createOnce(context) {
    let requireAllRoutes = true;

    return {
      before() {
        requireAllRoutes = booleanField(objectOptionAt(context, 0), 'requireAllRoutes', true);
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const method = getElysiaRouteMethod(node);
        if (!method) {
          return;
        }

        const handler = getElysiaRouteHandler(node);
        const handlerNode = handler && isFunctionLike(handler) ? handler : undefined;
        const usesStatus = Boolean(handlerNode && subtreeUsesElysiaStatus(handlerNode));
        const usesRedirect = Boolean(handlerNode && subtreeUsesElysiaRedirect(handlerNode));

        if (!requireAllRoutes && !usesStatus && !usesRedirect) {
          return;
        }

        const hook = getElysiaRouteHookObject(node);
        if (!hookHasResponse(hook)) {
          context.report({
            messageId: usesStatus ? 'missingResponseStatus' : 'missingResponse',
            data: { method },
            node: hook ?? node,
          });
          return;
        }

        if (usesRedirect && !routeHookResponseHasRedirectStatus(hook)) {
          context.report({
            messageId: 'missingRedirectStatus',
            data: { method },
            node: hook ?? node,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require response schema on Elysia routes (all routes by default; status/redirect when narrowed)',
    },
    messages: {
      missingResponse: 'Elysia `.{{method}}()` should declare a `response` schema.',
      missingResponseStatus:
        'Elysia `.{{method}}()` uses `status()`. Declare a `response` schema for typed status codes.',
      missingRedirectStatus:
        'Elysia `.{{method}}()` uses `redirect()`, include a redirect status (`301`/`302`/`303`/`307`/`308`) in `response`.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          requireAllRoutes: { type: 'boolean' },
          allow: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
        },
      },
    ],
    defaultOptions: [{ requireAllRoutes: true, allow: [] }],
    type: 'suggestion',
  },
});
