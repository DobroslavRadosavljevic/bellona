import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
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
export const requireRouteSchemaName = bnRuleName('require-route-schema');

export const requireRouteSchema: CreateOnceRule = defineBellonaRule({
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
      missingSchema: agentDiagnostic({
        problem:
          'Elysia `.{{method}}()` has no request schema (`body`, `query`, `params`, `headers`, or `cookie`).',
        why: 'Without a request schema, input is untyped and unparsed. Handlers then read raw HTTP bags.',
        fix: 'Add a schema object on `.{{method}}("/path", { body: …, query: …, params: … }, handler)` for every field the handler reads.',
        avoid: 'Do not type the handler argument as `Context`. Do not disable the rule.',
      }),
      missingParams: agentDiagnostic({
        problem:
          'Elysia `.{{method}}()` needs a `params` schema (the path has `:param` and/or the handler destructures `params`).',
        why: 'Path params are strings until you schema them. Missing `params` leaves them unparsed.',
        fix: 'Add `params: t.Object({ id: t.String() })` (or your schema) matching each `:token`.',
        avoid: 'Do not parse `params` by hand inside the handler. Do not disable the rule.',
      }),
      missingQuery: agentDiagnostic({
        problem: 'Elysia `.{{method}}()` destructures `query` but has no `query` schema.',
        why: 'Query strings are untrusted text until parsed.',
        fix: 'Add `query: t.Object({ … })` (or your schema) for every query field the handler reads.',
        avoid: 'Do not use `typeof` on query values. Do not disable the rule.',
      }),
      missingHeaders: agentDiagnostic({
        problem: 'Elysia `.{{method}}()` destructures `headers` but has no `headers` schema.',
        why: 'Headers are untrusted strings until parsed.',
        fix: 'Add `headers: t.Object({ authorization: t.String() })` (or your schema) for the headers you read.',
        avoid: 'Do not read `headers` as `Context`. Do not disable the rule.',
      }),
      missingCookie: agentDiagnostic({
        problem: 'Elysia `.{{method}}()` destructures `cookie` but has no `cookie` schema.',
        why: 'Cookies are untrusted until parsed. Also check `.value`, not the Proxy object.',
        fix: 'Add `cookie: t.Cookie({ … })` / the project cookie schema for each cookie the handler reads.',
        avoid: 'Do not `if (cookie.sid)`. Do not disable the rule.',
      }),
      missingBody: agentDiagnostic({
        problem: 'Elysia `.{{method}}()` destructures `body` but has no `body` schema.',
        why: 'Request bodies are untrusted until parsed.',
        fix: 'Add `body: t.Object({ … })` (or Zod/Effect Schema via the Elysia adapter) matching the handler fields.',
        avoid: 'Do not type `body` as `unknown`/`object`. Do not disable the rule.',
      }),
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
