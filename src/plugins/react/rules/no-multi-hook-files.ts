import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, isModuleLevelDeclaration } from '../ast.ts';
import { isHookFile, isHookName, matchesAllow } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, readAllowList } from '../options.ts';

export const noMultiHookFilesName = bnRuleName('no-multi-hook-files');

export const noMultiHookFiles: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow multiple React hooks in one use-*.ts(x) file',
    },
    messages: {
      multiple: agentDiagnostic({
        problem:
          'This `use-*.ts` or `use-*.tsx` file declares more than one React hook (`use` + PascalCase).',
        why: 'Hook files are one hook per basename. Extra hooks hide under the wrong file name.',
        fix: 'Move each extra hook into its own `use-*.ts(x)` file whose basename matches the hook.',
        avoid: 'Do not nest extra hooks as inner functions to hide them. Do not disable the rule.',
      }),
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
