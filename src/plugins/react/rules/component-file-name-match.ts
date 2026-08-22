import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getExportedExpressionName, unwrapComponentInit } from '../ast.ts';
import { basenameWithoutExtension, isPrimaryComponentName, kebabToPascal } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const componentFileNameMatchName = bnRuleName('component-file-name-match');

export const componentFileNameMatch: CreateOnceRule = defineBellonaRule({
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
        const basename = basenameWithoutExtension(context.filename);
        if (basename.length === 0 || basename.toLowerCase() === 'index') {
          return false;
        }
        expected = kebabToPascal(basename);
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
            if (unwrapComponentInit(declarator.init) === undefined) {
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
          return;
        }
        if (declaration.type === 'ClassDeclaration') {
          return;
        }
        const name = getExportedExpressionName(declaration);
        checkPrimary(declaration, name);
      },
    };
  },
});
