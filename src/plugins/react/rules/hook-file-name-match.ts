import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, isModuleLevelDeclaration } from '../ast.ts';
import {
  basenameWithoutExtension,
  hookNameFromBasename,
  isHookFile,
  isHookName,
  matchesAllow,
} from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, readAllowList } from '../options.ts';

export const hookFileNameMatchName = bnRuleName('react', 'hook-file-name-match');

export const hookFileNameMatch: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require hook declarations in use-*.ts(x) files to match the basename',
    },
    messages: {
      mismatch: 'Hook file basename should match the hook name: {{expected}}.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let expected: string | undefined;

    const checkName = (node: ESTree.Node, name: string | undefined) => {
      if (!isHookName(name) || expected === undefined || name === expected) {
        return;
      }
      context.report({
        messageId: 'mismatch',
        data: { expected },
        node,
      });
    };

    return {
      before() {
        const { filename } = context;
        if (!isHookFile(filename) || matchesAllow(filename, readAllowList(context))) {
          return false;
        }
        expected = hookNameFromBasename(basenameWithoutExtension(filename));
        if (expected === undefined) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        if (!isModuleLevelDeclaration(node)) {
          return;
        }
        checkName(node.id ?? node, node.id?.name);
      },
      VariableDeclarator(node) {
        if (
          !isFunctionLike(node.init) ||
          !isModuleLevelDeclaration(node) ||
          node.id.type !== 'Identifier'
        ) {
          return;
        }
        checkName(node.id, node.id.name);
      },
    };
  },
});
