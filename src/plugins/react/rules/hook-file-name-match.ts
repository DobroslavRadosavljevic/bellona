import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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

export const hookFileNameMatchName = bnRuleName('hook-file-name-match');

export const hookFileNameMatch: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require hook declarations in use-*.ts(x) files to match the basename',
    },
    messages: {
      mismatch: agentDiagnostic({
        problem:
          'This `use-*.ts(x)` file declares a hook whose name does not match the basename. Expected `{{expected}}` (`use-local-storage.ts` → `useLocalStorage`).',
        why: 'Hook file names are the public lookup key. A mismatch makes imports and the file tree disagree.',
        fix: 'Rename the hook to `{{expected}}`, or rename the file to the kebab-case form of the hook (`useLocalStorage` → `use-local-storage.ts`). Keep one hook per `use-*` file.',
        avoid: 'Do not add a second hook that matches the basename. Do not disable the rule.',
      }),
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
