import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isModuleLevelDeclaration, unwrapComponentInit } from '../ast.ts';
import { isPrimaryComponentName } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noMultiComponentFilesName = bnRuleName('react', 'no-multi-component-files');

export const noMultiComponentFiles: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow multiple primary React components in one file',
    },
    messages: {
      multiple: 'Keep one primary React component per file.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let count = 0;

    const register = (node: ESTree.Node, name: string | undefined) => {
      if (!isPrimaryComponentName(name)) {
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
        if (shouldSkipJsxFile(context)) {
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
          unwrapComponentInit(node.init) === undefined ||
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
