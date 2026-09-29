import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike } from '../ast.ts';
import {
  getElysiaRouteHandler,
  getElysiaRouteMethod,
  isElysiaStyleRouteCall,
  routeOrGuardHasSchemaKey,
  subtreeUsesElysiaRedirect,
  subtreeUsesElysiaStatus,
} from '../elysia.ts';
import { shouldSkipElysiaFile } from '../options.ts';

/**
 * Require a `response` schema on Elysia route hooks.
 * Default: all routes. When `requireAllRoutes` is false, only flags handlers
 * that use `status()` / `redirect()`.
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
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require response schema on Elysia routes (all routes by default; status()/redirect() routes when narrowed)',
    },
    messages: {
      missingResponse: agentDiagnostic({
        problem:
          'Elysia `.{{method}}()` has no `response` schema. `{ requireAllRoutes: true }` (default) requires it on every route.',
        why: 'Without `response`, Elysia does not validate or clean the returned body, so extra fields can leak to clients. The OpenAPI document also shows no response body.',
        fix: 'Add `{ response: { 200: t.Object(…), 404: t.Object(…) } }` (or your schema library) on this `.{{method}}()` call.',
        avoid:
          'Do not skip `response` because the handler “just returns JSON”. Do not disable the rule. Set `{ requireAllRoutes: false }` only when you intend to flag `status()`/`redirect()` routes only.',
      }),
      missingResponseStatus: agentDiagnostic({
        problem:
          'Elysia `.{{method}}()` calls `status()` but has no `response` schema for those status codes.',
        why: 'Eden gets the `status()` types from the handler, but Elysia validates and cleans a body only when `response` lists its status code. Without `response`, error bodies are not checked and OpenAPI does not show them.',
        fix: 'Declare `response` with an entry per status you return (`200`, `400`, …) matching the `status(code, body)` calls.',
        avoid: 'Do not return `status()` without listing that code. Do not disable the rule.',
      }),
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
