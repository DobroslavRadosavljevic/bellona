import type { CreateOnceRule } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import {
  DEFAULT_SCHEMA_REQUIRED_METHODS,
  getElysiaRouteHandler,
  getElysiaRouteMethod,
  getElysiaRoutePath,
  getHandlerDestructuredPropNames,
  isElysiaStyleRouteCall,
  routeOrGuardHasSchema,
  routeOrGuardHasSchemaKey,
  routePathHasParams,
} from '../elysia.ts';
import { shouldSkipElysiaFile } from '../options.ts';

/**
 * Require request validation schemas (`body` / `query` / `params` / …)
 * on mutating Elysia routes, plus `params` for `/:param` paths and schemas
 * matching destructured handler props (honors enclosing `.guard()` / `.group()`).
 */
export const requireRouteSchemaName = vmRuleName('require-route-schema');

export const requireRouteSchema: CreateOnceRule = defineVamanaRule({
  createOnce(context) {
    let methods = new Set<string>(DEFAULT_SCHEMA_REQUIRED_METHODS);

    return {
      before() {
        const listed = stringListField(
          objectOptionAt(context, 0),
          'methods',
          DEFAULT_SCHEMA_REQUIRED_METHODS,
        );
        methods = new Set(listed.map((method) => method.toLowerCase()));
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

        const path = getElysiaRoutePath(node);
        if (path && routePathHasParams(path) && !routeOrGuardHasSchemaKey(node, 'params')) {
          context.report({
            messageId: 'missingParams',
            data: { method },
            node,
          });
        }

        const destructured = getHandlerDestructuredPropNames(getElysiaRouteHandler(node));
        if (destructured.has('params') && !routeOrGuardHasSchemaKey(node, 'params')) {
          // Avoid double-reporting when the path already flagged missing params.
          if (!(path && routePathHasParams(path))) {
            context.report({
              messageId: 'missingParams',
              data: { method },
              node,
            });
          }
        }
        if (destructured.has('query') && !routeOrGuardHasSchemaKey(node, 'query')) {
          context.report({
            messageId: 'missingQuery',
            data: { method },
            node,
          });
        }
        if (destructured.has('headers') && !routeOrGuardHasSchemaKey(node, 'headers')) {
          context.report({
            messageId: 'missingHeaders',
            data: { method },
            node,
          });
        }
        if (destructured.has('cookie') && !routeOrGuardHasSchemaKey(node, 'cookie')) {
          context.report({
            messageId: 'missingCookie',
            data: { method },
            node,
          });
        }

        const hasAnySchema = routeOrGuardHasSchema(node);
        if (destructured.has('body') && !routeOrGuardHasSchemaKey(node, 'body') && hasAnySchema) {
          context.report({
            messageId: 'missingBody',
            data: { method },
            node,
          });
        }

        if (!methods.has(method) || hasAnySchema) {
          return;
        }
        context.report({
          messageId: 'missingSchema',
          data: { method },
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require body/query/params schemas on mutating Elysia routes, path params, and destructured handler props',
    },
    messages: {
      missingSchema:
        'Elysia `.{{method}}()` should declare a request schema (`body`, `query`, `params`, `headers`, or `cookie`).',
      missingParams:
        'Elysia `.{{method}}()` should declare a `params` schema (path has `:param` and/or handler destructures `params`).',
      missingQuery:
        'Elysia `.{{method}}()` should declare a `query` schema (handler destructures `query`).',
      missingHeaders:
        'Elysia `.{{method}}()` should declare a `headers` schema (handler destructures `headers`).',
      missingCookie:
        'Elysia `.{{method}}()` should declare a `cookie` schema (handler destructures `cookie`).',
      missingBody:
        'Elysia `.{{method}}()` should declare a `body` schema (handler destructures `body`).',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          methods: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
          allow: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
        },
      },
    ],
    defaultOptions: [{ methods: [...DEFAULT_SCHEMA_REQUIRED_METHODS], allow: [] }],
    type: 'problem',
  },
});
