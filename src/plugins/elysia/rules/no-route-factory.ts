import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isExportedNode } from '../elysia.ts';
import { shouldSkipRouteFactoryFile } from '../options.ts';

/** Default banned export-name patterns for HTTP/route factories. */
export const DEFAULT_ROUTE_FACTORY_PATTERNS = [
  '^(make|create).*(Route|Handler|Http)',
  'RouteFactory$',
  'HttpMapper$',
] as const;

/** Compile user regex sources, skipping invalid patterns. */
const compilePatterns = (sources: readonly string[]): RegExp[] => {
  const patterns: RegExp[] = [];
  for (const source of sources) {
    try {
      patterns.push(new RegExp(source, 'iu'));
    } catch {
      // Ignore invalid user regexes.
    }
  }
  return patterns;
};

const matchesFactoryName = (name: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(name));

const reportIfFactory = (
  context: {
    report: (descriptor: {
      messageId: 'factory';
      data: { name: string };
      node: ESTree.Node;
    }) => void;
  },
  name: string | undefined,
  node: ESTree.Node,
  patterns: readonly RegExp[],
) => {
  if (!name || !matchesFactoryName(name, patterns)) {
    return;
  }
  context.report({
    messageId: 'factory',
    data: { name },
    node,
  });
};

/**
 * Ban exported HTTP/route factory helpers (`make*Route`, `*HttpMapper`, …)
 * under `modules/` / `routes/`. Keep one route plugin per file instead.
 */
export const noRouteFactoryName = bnRuleName('no-route-factory');

export const noRouteFactory: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    let patterns = compilePatterns(DEFAULT_ROUTE_FACTORY_PATTERNS);

    return {
      before() {
        const listed = stringListField(
          objectOptionAt(context, 0),
          'patterns',
          DEFAULT_ROUTE_FACTORY_PATTERNS,
        );
        patterns = compilePatterns(listed);
        if (patterns.length === 0) {
          return false;
        }
        if (shouldSkipRouteFactoryFile(context)) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        if (!isExportedNode(node)) {
          return;
        }
        reportIfFactory(context, node.id?.name, node.id ?? node, patterns);
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier') {
          return;
        }
        if (
          node.init?.type !== 'ArrowFunctionExpression' &&
          node.init?.type !== 'FunctionExpression'
        ) {
          return;
        }
        if (!isExportedNode(node)) {
          return;
        }
        reportIfFactory(context, node.id.name, node.id, patterns);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow exported make/create Route/Handler/Http factory helpers in modules/routes',
    },
    messages: {
      factory: agentDiagnostic({
        problem:
          'This file under `/modules/` or `/routes/` exports a route/HTTP factory named `{{name}}` (default patterns: `make*Route` / `create*Handler` / `RouteFactory` / `HttpMapper`).',
        why: 'Factories hide the one-route-per-file layout. Callers then compose HTTP in the wrong layer.',
        fix: 'Replace the factory with one Elysia route plugin file (`export const featureActionRoute = new Elysia({ name: "FEATURE_ACTION_ROUTE" }).get(…)`). Mount it from `routes/index.ts` with `.use`.',
        avoid:
          'Do not rename the factory to dodge the regex. Do not disable the rule. Tune `{ patterns }` only for true exceptions.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          patterns: {
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
    defaultOptions: [{ patterns: [...DEFAULT_ROUTE_FACTORY_PATTERNS], allow: [] }],
    type: 'suggestion',
  },
});
