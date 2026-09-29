import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike } from '../ast.ts';
import {
  getApplicableGuardHooks,
  getElysiaRouteHandler,
  getElysiaRouteHookObject,
  getObjectPropertyValue,
  getStaticStatusCode,
  isElysiaStatusCall,
  isElysiaStyleRouteCall,
  objectHasOwnProperty,
  objectHasSpread,
  resolveIdentifierInit,
  ROUTE_LIFECYCLE_HOOK_KEYS,
  ROUTE_SCHEMA_KEYS,
  subtreeMatches,
} from '../elysia.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipElysiaFile } from '../options.ts';

/**
 * Route hook keys that Elysia itself defines. Any other key is a macro, which
 * can add `response` entries that this rule cannot see.
 */
const KNOWN_ROUTE_HOOK_KEYS = new Set([
  ...ROUTE_SCHEMA_KEYS,
  ...ROUTE_LIFECYCLE_HOOK_KEYS,
  'response',
  'detail',
  'type',
  'config',
  'tags',
  'schema',
  'trace',
]);

/** Static numeric keys of an inline `response: { 200: …, 404: … }` object. */
const getResponseStatusKeys = (hook: ESTree.ObjectExpression): Set<number> | undefined => {
  if (objectHasSpread(hook)) {
    return undefined;
  }
  for (const property of hook.properties) {
    if (property.type !== 'Property' || property.computed) {
      return undefined;
    }
    const key = getStaticPropertyName(property.key);
    if (key === undefined || !KNOWN_ROUTE_HOOK_KEYS.has(key)) {
      return undefined;
    }
  }
  const response = getObjectPropertyValue(hook, 'response');
  const object = response && (resolveIdentifierInit(response) ?? response);
  if (object?.type !== 'ObjectExpression' || objectHasSpread(object)) {
    return undefined;
  }
  const keys = new Set<number>();
  for (const property of object.properties) {
    if (property.type !== 'Property' || property.computed) {
      return undefined;
    }
    const key = getStaticPropertyName(property.key);
    if (key === undefined || !/^\d{3}$/u.test(key)) {
      return undefined;
    }
    keys.add(Number(key));
  }
  return keys;
};

/**
 * True when `status` is destructured from the handler context
 * (`({ status }) => …`). That `status` is typed against `response`
 * (`SelectiveStatus`), so TypeScript already rejects unknown codes.
 */
const handlerDestructuresStatus = (handler: ESTree.Function | ESTree.ArrowFunctionExpression) => {
  let [pattern] = handler.params;
  if (pattern?.type === 'AssignmentPattern') {
    pattern = pattern.left;
  }
  return (
    pattern?.type === 'ObjectPattern' &&
    pattern.properties.some(
      (property) =>
        property.type === 'Property' &&
        !property.computed &&
        getStaticPropertyName(property.key) === 'status',
    )
  );
};

/**
 * Report `status(N, …)` in a route handler when the route's inline `response`
 * object has no key `N`. Elysia validates and cleans a body only for status
 * codes that `response` lists. Only the `status` imported from `elysia` is
 * checked: the context `status` is typed against `response`.
 */
export const statusCodeInResponseName = bnRuleName('status-code-in-response');

export const statusCodeInResponse: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        if (!isElysiaStyleRouteCall(node)) {
          return;
        }
        const handler = getElysiaRouteHandler(node);
        if (!isFunctionLike(handler) || handlerDestructuresStatus(handler)) {
          return;
        }
        const hook = getElysiaRouteHookObject(node);
        if (!hook) {
          return;
        }
        const keys = getResponseStatusKeys(hook);
        if (!keys) {
          return;
        }
        if (
          getApplicableGuardHooks(node).some((guard) => objectHasOwnProperty(guard, 'response'))
        ) {
          return;
        }

        subtreeMatches(handler.body ?? undefined, (current) => {
          if (current.type !== 'CallExpression' || !isElysiaStatusCall(current)) {
            return false;
          }
          const code = getStaticStatusCode(current.arguments[0]);
          if (code !== undefined && !keys.has(code)) {
            context.report({
              messageId: 'statusNotInResponse',
              data: { code: String(code) },
              node: current,
            });
          }
          return false;
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require each status(N, …) in an Elysia route to have a matching key in its inline response schema',
    },
    messages: {
      statusNotInResponse: agentDiagnostic({
        problem:
          'This route returns `status({{code}}, …)`, but its `response` object has no `{{code}}` key.',
        why: 'Elysia validates and cleans a returned body only for status codes that `response` lists. This body goes out unchecked, and OpenAPI does not show it. The `status` imported from `elysia` is not typed against `response`, so TypeScript does not catch this.',
        fix: 'Add `{{code}}: <schema>` to `response`. Or use the `status` from the handler context (`({ status }) => …`), which TypeScript checks against `response`.',
        avoid: 'Do not use `t.Any()` for the new key. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
