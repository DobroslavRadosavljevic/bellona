import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { resolveIdentifierInit } from '../elysia.ts';
import { shouldSkipElysiaFile } from '../options.ts';

/** Default context keys that hold app singletons. */
export const DEFAULT_SINGLETON_NAMES = ['db', 'database', 'runtime', 'redis', 'client'] as const;

type Argument = ESTree.CallExpression['arguments'][number];

/** `{ as: 'override' }` options object that `.decorate(options, …)` takes first. */
const isDecorateOptions = (argument: Argument | undefined): boolean => {
  if (!argument || argument.type === 'SpreadElement') {
    return false;
  }
  const object = unwrapExpression(argument);
  return (
    object?.type === 'ObjectExpression' &&
    object.properties.length > 0 &&
    object.properties.every(
      (property) => property.type === 'Property' && getStaticPropertyName(property.key) === 'as',
    )
  );
};

/**
 * Disallow `.decorate('db', db)` / `.decorate({ db, runtime })`. App singletons
 * belong in their own modules, imported where they are used, not on the
 * Elysia context.
 */
export const noDecorateSingletonsName = bnRuleName('no-decorate-singletons');

export const noDecorateSingletons: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    let names = new Set<string>(DEFAULT_SINGLETON_NAMES);

    return {
      before() {
        names = new Set(
          stringListField(objectOptionAt(context, 0), 'names', DEFAULT_SINGLETON_NAMES),
        );
        if (names.size === 0 || shouldSkipElysiaFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (
          callee?.type !== 'MemberExpression' ||
          getStaticPropertyName(callee.property) !== 'decorate'
        ) {
          return;
        }
        const args =
          node.arguments.length >= 2 && isDecorateOptions(node.arguments[0])
            ? node.arguments.slice(1)
            : node.arguments;
        const [first] = args;
        if (!first || first.type === 'SpreadElement') {
          return;
        }

        const key = unwrapExpression(first);
        if (key?.type === 'Literal' && isJsString(key.value)) {
          if (names.has(key.value)) {
            context.report({ messageId: 'singleton', data: { name: key.value }, node: key });
          }
          return;
        }

        const object = resolveIdentifierInit(first) ?? key;
        if (object?.type !== 'ObjectExpression') {
          return;
        }
        for (const property of object.properties) {
          if (property.type !== 'Property' || property.computed) {
            continue;
          }
          const name = getStaticPropertyName(property.key);
          if (name !== undefined && names.has(name)) {
            context.report({ messageId: 'singleton', data: { name }, node: property });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow .decorate() of app singletons (db, runtime, redis, client) on the Elysia context',
    },
    messages: {
      singleton: agentDiagnostic({
        problem:
          '`.decorate()` puts the app singleton `{{name}}` on the Elysia context (default names: `db`, `database`, `runtime`, `redis`, `client`).',
        why: 'A singleton on the context hides the module that owns it. Every route then depends on the plugin that decorates it, and tests must build that plugin to get the value.',
        fix: 'Import the module that owns `{{name}}` directly in the file that uses it (for Effect, run services through the runtime module). Keep `.decorate()` for HTTP-only values.',
        avoid:
          'Do not rename the key to dodge the list. Do not pass the singleton into a route factory. Do not disable the rule. Set `{ names }` only for true exceptions.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          names: {
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
    defaultOptions: [{ names: [...DEFAULT_SINGLETON_NAMES], allow: [] }],
    type: 'suggestion',
  },
});
