import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { isFunctionLike } from '../ast.ts';
import { basenameWithoutExtension, isPrimaryComponentName, kebabToPascal } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const componentFileNameMatchName = vmRuleName('component-file-name-match');

export const componentFileNameMatch: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require the primary exported component name to match the file basename',
    },
    messages: {
      mismatch: 'Primary component export should match the file basename: {{expected}}.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let expected = '';
    let checkedPrimary = false;

    const checkPrimary = (node: ESTree.Node, name: string | undefined) => {
      if (checkedPrimary || !isPrimaryComponentName(name)) {
        return;
      }
      checkedPrimary = true;

      if (name !== expected) {
        context.report({
          messageId: 'mismatch',
          data: { expected },
          node,
        });
      }
    };

    return {
      before() {
        checkedPrimary = false;
        if (shouldSkipJsxFile(context)) {
          return false;
        }
        expected = kebabToPascal(basenameWithoutExtension(context.filename));
        if (expected.length === 0) {
          return false;
        }
      },
      ExportNamedDeclaration(node) {
        const { declaration } = node;

        if (declaration?.type === 'FunctionDeclaration') {
          checkPrimary(declaration.id ?? declaration, declaration.id?.name);
        }

        if (declaration?.type === 'VariableDeclaration') {
          for (const declarator of declaration.declarations) {
            if (!isFunctionLike(declarator.init)) {
              continue;
            }
            if (declarator.id.type === 'Identifier') {
              checkPrimary(declarator.id, declarator.id.name);
            }
          }
        }
      },
      ExportDefaultDeclaration(node) {
        const { declaration } = node;
        if (declaration.type === 'FunctionDeclaration') {
          checkPrimary(declaration.id ?? declaration, declaration.id?.name);
        }
      },
    };
  },
});
