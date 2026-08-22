import type { CreateOnceRule } from '@oxlint/plugins';

import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike } from '../ast.ts';
import {
  getElysiaRouteHandler,
  getElysiaRouteMethod,
  isElysiaStyleRouteCall,
  routeOrGuardHasSchemaKey,
  routeOrGuardResponseHasRedirectStatus,
  subtreeUsesElysiaRedirect,
  subtreeUsesElysiaStatus,
} from '../elysia.ts';
import { shouldSkipElysiaFile } from '../options.ts';

/**
 * Require a `response` schema on Elysia route hooks.
 * Default: all routes. Also flags handlers that use `status()` / `redirect()`
 * when `requireAllRoutes` is false, and redirects missing redirect status keys.
 */
export const requireResponseSchemaName = bnRuleName('require-response-schema');

export const requireResponseSchema: CreateOnceRule = defineBellonaRule({
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
        if (!isElysiaStyleRouteCall(node)) {
          return;
        }
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

        if (!routeOrGuardHasSchemaKey(node, 'response')) {
          context.report({
            messageId: usesStatus ? 'missingResponseStatus' : 'missingResponse',
            data: { method },
            node,
          });
          return;
        }

        if (usesRedirect && !routeOrGuardResponseHasRedirectStatus(node)) {
          context.report({
            messageId: 'missingRedirectStatus',
            data: { method },
            node,
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
