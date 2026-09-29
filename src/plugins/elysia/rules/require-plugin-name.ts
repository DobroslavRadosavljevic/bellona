import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import {
  chainIncludesListen,
  elysiaOptionsHasName,
  getRootNewElysiaExpression,
  isExportedNode,
  isNewElysiaExpression,
} from '../elysia.ts';
import { isRoutesLeafFile } from '../filename.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipNamedElysiaPlugin,
} from '../options.ts';

/** True when the node is an exported Elysia instance binding. */
const isExportedElysiaInstance = (node: ESTree.Node): boolean => {
  let current: ESTree.Node | undefined = node;
  while (current) {
    if (current.type === 'ExportNamedDeclaration' || current.type === 'ExportDefaultDeclaration') {
      return true;
    }
    if (
      current.type === 'VariableDeclarator' &&
      current.parent.type === 'VariableDeclaration' &&
      current.parent.parent.type === 'ExportNamedDeclaration'
    ) {
      return true;
    }
    current = current.parent ?? undefined;
  }
  return false;
};

/**
 * True when `node` is the root `new Elysia()` of an exported binding or default
 * export. In routes leaf files, `require-route-export-name` reports that
 * instance (name option or default export), so this rule skips it.
 */
const isRouteExportRoot = (node: ESTree.NewExpression): boolean => {
  let current: ESTree.Node | undefined = node.parent ?? undefined;
  while (current) {
    if (current.type === 'VariableDeclarator') {
      return (
        current.id.type === 'Identifier' &&
        isExportedNode(current) &&
        getRootNewElysiaExpression(current.init ?? undefined) === node
      );
    }
    if (current.type === 'ExportDefaultDeclaration') {
      const { declaration } = current;
      if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') {
        return false;
      }
      return getRootNewElysiaExpression(unwrapExpression(declaration)) === node;
    }
    current = current.parent ?? undefined;
  }
  return false;
};

/**
 * Require `{ name: "…" }` on **exported** `new Elysia(...)` plugins so
 * lifecycle deduplication works. Skips `.listen(...)` chains and entry paths.
 * Skips route exports in routes leaf files (`require-route-export-name` covers them).
 */
export const requirePluginNameName = bnRuleName('require-plugin-name');

export const requirePluginName: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipNamedElysiaPlugin(context)) {
          return false;
        }
      },
      NewExpression(node) {
        if (!isNewElysiaExpression(node)) {
          return;
        }
        if (elysiaOptionsHasName(node)) {
          return;
        }
        if (chainIncludesListen(node)) {
          return;
        }
        // Local feature controllers are fine; exported plugins need a name.
        if (!isExportedElysiaInstance(node)) {
          return;
        }
        if (isRoutesLeafFile(context.filename) && isRouteExportRoot(node)) {
          return;
        }
        context.report({ messageId: 'missingName', node });
      },
    };
  },
  meta: {
    docs: {
      description: 'Require name on exported new Elysia() plugin instances for deduplication',
    },
    messages: {
      missingName: agentDiagnostic({
        problem:
          'This exported `new Elysia(...)` plugin has no `{ name: "…" }`. Entry files (`main` / `server` / `index` / `app`) and `.listen()` apps are skipped.',
        why: 'Unnamed plugins cannot be deduplicated when `.use`d twice. Lifecycle hooks then run twice.',
        fix: 'Pass `{ name: "feature-plugin" }` (stable string) as the first argument: `new Elysia({ name: "FEATURE" })`.',
        avoid: 'Do not use a computed name. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
