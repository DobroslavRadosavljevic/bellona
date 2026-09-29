import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

const declarationFilePattern = /\.d\.[cm]?ts$/u;

function hasModuleSyntax(program: ESTree.Program): boolean {
  return program.body.some(
    (statement) =>
      statement.type === 'ImportDeclaration' ||
      statement.type === 'ExportAllDeclaration' ||
      statement.type === 'ExportDefaultDeclaration' ||
      statement.type === 'ExportNamedDeclaration' ||
      statement.type === 'TSExportAssignment' ||
      statement.type === 'TSNamespaceExportDeclaration' ||
      (statement.type === 'TSImportEqualsDeclaration' &&
        statement.moduleReference.type === 'TSExternalModuleReference'),
  );
}

/**
 * A declaration file with no top-level `import` or `export` is a global script
 * (`env.d.ts`, `worker-configuration.d.ts`). A top-level `import type` turns it
 * into a module, so its interfaces stop merging with the global ones. There,
 * `import()` types are the only way to name another module.
 * @see https://www.typescriptlang.org/docs/handbook/2/modules.html#how-javascript-modules-are-defined
 */
function isGlobalDeclarationFile(filename: string, program: ESTree.Program): boolean {
  return declarationFilePattern.test(filename) && !hasModuleSyntax(program);
}

export const noInlineImportTypeName = bnRuleName('no-inline-import-type');

export const noInlineImportType: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow TypeScript import() types. Use a top-level type import instead of an inline module type.',
    },
    messages: {
      inlineImportType: agentDiagnostic({
        problem:
          'This type uses an inline TypeScript `import("{{source}}")` (including `import("{{source}}").Name` and `typeof import("{{source}}")`). A runtime `import("{{source}}")` expression is not this rule.',
        why: 'Inline `import()` types hide the module graph inside a type position. Tools, refactors, and readers cannot see the dependency at the top of the file.',
        fix: 'Add a top-level type import, then use the imported name. Example: `import type { LightboxTravel } from "{{source}}"` then `useRef<LightboxTravel | null>(null)`. For `typeof import("{{source}}")`, write `import type * as Module from "{{source}}"` and use `typeof Module`.',
        avoid:
          'Do not keep `import("{{source}}")` in a type alias. Do not switch to `require()`. Do not disable the rule. Runtime dynamic `import()` for values is allowed and is not the fix here.',
      }),
    },
  },
  createOnce(context) {
    let globalDeclarationFile = false;

    return {
      Program(node) {
        globalDeclarationFile = isGlobalDeclarationFile(context.filename, node);
      },
      TSImportType(node) {
        if (globalDeclarationFile) return;
        const source = node.source.value;
        context.report({
          node,
          messageId: 'inlineImportType',
          data: { source: isJsString(source) ? source : '' },
        });
      },
    };
  },
});
