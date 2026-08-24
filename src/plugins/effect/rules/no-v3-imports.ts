import type { Context, CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { matchesAllow } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, readAllowList } from '../options.ts';
import { v3ImportReplacement } from '../v3-imports.ts';

export const noV3ImportsName = bnRuleName('no-v3-imports');

function reportMoved(context: Context, sourceNode: ESTree.Node, source: string): void {
  const replacement = v3ImportReplacement(source);
  if (replacement === undefined) {
    return;
  }
  context.report({
    messageId: 'moved',
    node: sourceNode,
    data: { source, replacement },
  });
}

function reportSpecifierLiteral(context: Context, node: ESTree.Node | null | undefined): void {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'Literal' || !isJsString(expression.value)) {
    return;
  }
  reportMoved(context, expression, expression.value);
}

export const noV3Imports: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Effect v3 module specifiers that moved in Effect v4',
    },
    messages: {
      moved: 'Import {{replacement}} instead of "{{source}}".',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (matchesAllow(context.filename, readAllowList(context))) {
          return false;
        }
      },
      ImportDeclaration(node) {
        reportSpecifierLiteral(context, node.source);
      },
      ExportNamedDeclaration(node) {
        reportSpecifierLiteral(context, node.source);
      },
      ExportAllDeclaration(node) {
        reportSpecifierLiteral(context, node.source);
      },
      ImportExpression(node) {
        reportSpecifierLiteral(context, node.source);
      },
    };
  },
});
