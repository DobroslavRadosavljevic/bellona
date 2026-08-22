import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, isModuleLevelDeclaration } from '../ast.ts';
import { isHookFile, isHookName, matchesAllow } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, readAllowList } from '../options.ts';

export const noMultiHookFilesName = vmRuleName('no-multi-hook-files');

export const noMultiHookFiles: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow multiple React hooks in one use-*.ts(x) file',
    },
    messages: {
      multiple: 'Keep one React hook per use-*.ts or use-*.tsx file.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let count = 0;

    const register = (node: ESTree.Node, name: string | undefined) => {
      if (!isHookName(name)) {
        return;
      }
      count += 1;
      if (count > 1) {
        context.report({ messageId: 'multiple', node });
      }
    };

    return {
      before() {
        count = 0;
        const { filename } = context;
        if (!isHookFile(filename) || matchesAllow(filename, readAllowList(context))) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        if (!isModuleLevelDeclaration(node)) {
          return;
        }
        register(node.id ?? node, node.id?.name);
      },
      VariableDeclarator(node) {
        if (
          !isFunctionLike(node.init) ||
          !isModuleLevelDeclaration(node) ||
          node.id.type !== 'Identifier'
        ) {
          return;
        }
        register(node.id, node.id.name);
      },
    };
  },
});
