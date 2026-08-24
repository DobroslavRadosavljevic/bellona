import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { chainIncludesListen, elysiaOptionsHasName, isNewElysiaExpression } from '../elysia.ts';
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
 * Require `{ name: "…" }` on **exported** `new Elysia(...)` plugins so
 * lifecycle deduplication works. Skips `.listen(...)` chains and entry paths.
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
        context.report({ messageId: 'missingName', node });
      },
    };
  },
  meta: {
    docs: {
      description: 'Require name on exported new Elysia() plugin instances for deduplication',
    },
    messages: {
      missingName:
        'Provide `{ name: "…" }` on exported `new Elysia(...)` plugins so lifecycle can be deduplicated when reused.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'suggestion',
  },
});
