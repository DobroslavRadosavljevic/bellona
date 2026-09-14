import type { CreateOnceRule, Scope, SourceCode, Variable } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { matchesAllow } from '../filename.ts';
import { DEFAULT_ALLOW_RENAMES, readNoUselessReexportOptions } from '../options.ts';

export const noUselessReexportName = bnRuleName('no-useless-reexport');

interface ImportedName {
  readonly local: ESTree.BindingIdentifier;
  readonly original: string;
  readonly source: string;
  readonly isNamespace: boolean;
}

interface Finding {
  readonly messageId: 'starReexport' | 'passThrough' | 'importReexport';
  readonly node: ESTree.Node;
  readonly name: string;
  readonly source: string;
}

function moduleExportName(node: ESTree.ModuleExportName): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'Literal' && isJsString(node.value)) {
    return node.value;
  }
  return null;
}

function parentOf(node: ESTree.Node): ESTree.Node | undefined {
  return node.parent ?? undefined;
}

function isDirective(statement: ESTree.Directive | ESTree.Statement): boolean {
  return (
    statement.type === 'ExpressionStatement' &&
    'directive' in statement &&
    isJsString(statement.directive)
  );
}

function isNeutralStatement(statement: ESTree.Directive | ESTree.Statement): boolean {
  return statement.type === 'EmptyStatement' || isDirective(statement);
}

function literalSource(source: ESTree.StringLiteral | null | undefined): string | null {
  if (source === null || source === undefined) {
    return null;
  }
  return isJsString(source.value) ? source.value : null;
}

function isRename(original: string, exported: string | null): boolean {
  return exported !== null && original !== exported;
}

function resolveNamedVariable(sourceCode: SourceCode, node: ESTree.Node): Variable | null {
  if (node.type !== 'Identifier') {
    return null;
  }
  let scope: Scope | null = sourceCode.getScope(node);
  while (scope !== null) {
    const variable = scope.set.get(node.name);
    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }
  return null;
}

function isImportNameIdentifier(node: ESTree.Node): boolean {
  const parent = parentOf(node);
  return (
    parent?.type === 'ImportSpecifier' ||
    parent?.type === 'ImportDefaultSpecifier' ||
    parent?.type === 'ImportNamespaceSpecifier'
  );
}

function isInsideExportFrom(node: ESTree.Node): boolean {
  let current: ESTree.Node | undefined = parentOf(node);
  while (current !== undefined) {
    if (current.type === 'ExportNamedDeclaration' && current.source !== null) {
      return true;
    }
    if (current.type === 'ExportAllDeclaration') {
      return true;
    }
    current = parentOf(current);
  }
  return false;
}

function isLocalReexportIdentifier(node: ESTree.Node): boolean {
  const parent = parentOf(node);
  if (parent === undefined) {
    return false;
  }
  if (parent.type === 'ExportSpecifier') {
    const declaration = parentOf(parent);
    return declaration?.type === 'ExportNamedDeclaration' && declaration.source === null;
  }
  return parent.type === 'ExportDefaultDeclaration' && parent.declaration === node;
}

function importedNames(statement: ESTree.ImportDeclaration): ImportedName[] {
  const source = literalSource(statement.source);
  if (source === null) {
    return [];
  }
  const names: ImportedName[] = [];
  for (const specifier of statement.specifiers) {
    if (specifier.type === 'ImportSpecifier') {
      names.push({
        local: specifier.local,
        original: moduleExportName(specifier.imported) ?? specifier.local.name,
        source,
        isNamespace: false,
      });
      continue;
    }
    if (specifier.type === 'ImportDefaultSpecifier') {
      names.push({
        local: specifier.local,
        original: 'default',
        source,
        isNamespace: false,
      });
      continue;
    }
    names.push({
      local: specifier.local,
      original: '*',
      source,
      isNamespace: true,
    });
  }
  return names;
}

function importVariable(sourceCode: SourceCode, local: ESTree.BindingIdentifier): Variable | null {
  const declared = sourceCode.getDeclaredVariables(local);
  for (const variable of declared) {
    if (variable.name === local.name) {
      return variable;
    }
  }
  return resolveNamedVariable(sourceCode, local);
}

function identifierIsLocalUse(node: ESTree.Node, importedLocal: ESTree.BindingIdentifier): boolean {
  return (
    node !== importedLocal &&
    !isImportNameIdentifier(node) &&
    !isInsideExportFrom(node) &&
    !isLocalReexportIdentifier(node)
  );
}

function nameIsUsedLocally(sourceCode: SourceCode, imported: ImportedName): boolean {
  const variable = importVariable(sourceCode, imported.local);
  if (variable === null) {
    return false;
  }
  for (const reference of variable.references) {
    if (identifierIsLocalUse(reference.identifier, imported.local)) {
      return true;
    }
  }
  for (const identifier of variable.identifiers) {
    if (identifierIsLocalUse(identifier, imported.local)) {
      return true;
    }
  }
  return false;
}

function namedExportOfLocal(
  statement: ESTree.ExportNamedDeclaration,
  localName: string,
): ESTree.ExportSpecifier | undefined {
  if (statement.source !== null || statement.declaration !== null) {
    return undefined;
  }
  for (const specifier of statement.specifiers) {
    const local = moduleExportName(specifier.local);
    if (local === localName) {
      return specifier;
    }
  }
  return undefined;
}

function exportedLocalNames(program: ESTree.Program): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of program.body) {
    if (
      statement.type === 'ExportDefaultDeclaration' &&
      statement.declaration.type === 'Identifier'
    ) {
      names.add(statement.declaration.name);
      continue;
    }
    if (statement.type !== 'ExportNamedDeclaration' || statement.source !== null) {
      continue;
    }
    if (statement.declaration !== null) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      const local = moduleExportName(specifier.local);
      if (local !== null) {
        names.add(local);
      }
    }
  }
  return names;
}

function collectImportReexports(
  sourceCode: SourceCode,
  program: ESTree.Program,
  imported: ImportedName,
  allowRenames: boolean,
): Finding[] {
  if (nameIsUsedLocally(sourceCode, imported)) {
    return [];
  }
  const findings: Finding[] = [];
  for (const statement of program.body) {
    if (
      statement.type === 'ExportDefaultDeclaration' &&
      statement.declaration.type === 'Identifier'
    ) {
      if (statement.declaration.name !== imported.local.name) {
        continue;
      }
      if (!imported.isNamespace && allowRenames && isRename(imported.original, 'default')) {
        continue;
      }
      findings.push({
        messageId: 'importReexport',
        node: statement,
        name: imported.local.name,
        source: imported.source,
      });
      continue;
    }
    if (statement.type !== 'ExportNamedDeclaration') {
      continue;
    }
    const specifier = namedExportOfLocal(statement, imported.local.name);
    if (specifier === undefined) {
      continue;
    }
    const exported = moduleExportName(specifier.exported);
    if (
      !imported.isNamespace &&
      allowRenames &&
      exported !== null &&
      isRename(imported.original, exported)
    ) {
      continue;
    }
    findings.push({
      messageId: 'importReexport',
      node: specifier,
      name: imported.local.name,
      source: imported.source,
    });
  }
  return findings;
}

function collectSourceReexports(
  statement: ESTree.ExportNamedDeclaration,
  allowRenames: boolean,
): Finding[] {
  const source = literalSource(statement.source);
  if (source === null) {
    return [];
  }
  if (statement.specifiers.length === 0) {
    return [{ messageId: 'passThrough', node: statement, name: '*', source }];
  }
  const findings: Finding[] = [];
  for (const specifier of statement.specifiers) {
    const original = moduleExportName(specifier.local);
    const exported = moduleExportName(specifier.exported);
    if (original === null) {
      continue;
    }
    if (allowRenames && isRename(original, exported)) {
      continue;
    }
    findings.push({
      messageId: 'passThrough',
      node: specifier,
      name: exported ?? original,
      source,
    });
  }
  return findings;
}

function hasLocalWork(program: ESTree.Program, importedLocals: ReadonlySet<string>): boolean {
  for (const statement of program.body) {
    if (isNeutralStatement(statement) || statement.type === 'ImportDeclaration') {
      continue;
    }
    if (statement.type === 'ExportAllDeclaration') {
      continue;
    }
    if (statement.type === 'ExportNamedDeclaration' && statement.source !== null) {
      continue;
    }
    if (
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration === null &&
      statement.specifiers.every((specifier) => {
        const local = moduleExportName(specifier.local);
        return local !== null && importedLocals.has(local);
      })
    ) {
      continue;
    }
    if (
      statement.type === 'ExportDefaultDeclaration' &&
      statement.declaration.type === 'Identifier' &&
      importedLocals.has(statement.declaration.name)
    ) {
      continue;
    }
    return true;
  }
  return false;
}

function hasSideEffectImport(program: ESTree.Program): boolean {
  return program.body.some(
    (statement) => statement.type === 'ImportDeclaration' && statement.specifiers.length === 0,
  );
}

/** Ban pass-through re-exports and files that exist only to re-export. */
export const noUselessReexport: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow re-export-only files and unchanged re-exports. Import from the source module instead.',
    },
    messages: {
      reexportFile: agentDiagnostic({
        problem:
          'This file only re-exports other modules (`export … from`, `export *`, or import-then-export with no local use). A rename-only file still counts.',
        why: 'A re-export file (barrel) hides the real module. Callers import a pass-through path, and the public surface is not listed in one owner file.',
        fix: 'Delete this file. Import the source module at each use site (`import { User } from "./user"`). If this path is a published package entry that must stay stable, add it to `{ allow: ["that-file.ts"] }` on `bl-js/no-useless-reexport`.',
        avoid:
          'Do not add a dummy function to “make it mixed”. Do not keep `export *`. Do not disable the rule on a new barrel.',
      }),
      starReexport: agentDiagnostic({
        problem:
          'This mixed file re-exports every name from "{{source}}" (`export *` or `export * as ns`).',
        why: '`export *` dumps an unknown surface. Callers cannot see which names this module owns.',
        fix: 'Remove the star re-export. Import the names you need from "{{source}}" at each use site. If you need a namespace locally, `import * as Ns from "{{source}}"` and use `Ns` in this file — do not re-export it unless this file also uses it.',
        avoid:
          'Do not replace `export *` with a long `export { a, b, c } from "{{source}}"` list. That is still a pass-through. Do not disable the rule.',
      }),
      passThrough: agentDiagnostic({
        problem:
          'This mixed file re-exports "{{name}}" unchanged from "{{source}}" (`export { {{name}} } from "…"`, including `export { default }` and type-only forms).',
        why: 'The name did not change and this file does not own it. Callers should import "{{source}}" directly.',
        fix: 'Remove this specifier. Import "{{name}}" from "{{source}}" where it is used. A rename in a mixed file (`export { Internal as User } from "{{source}}"`) is allowed unless `{ allowRenames: false }`.',
        avoid:
          'Do not copy the symbol into this file only to export it. Do not add `export { {{name}} as {{name}} }`. Do not disable the rule.',
      }),
      importReexport: agentDiagnostic({
        problem:
          'This mixed file imports "{{name}}" from "{{source}}" only to export it. The binding is not used in local code (shadowed inner names do not count as a use).',
        why: 'That is a pass-through re-export split across two statements. It adds a file to the import path without new behavior.',
        fix: 'Remove the export of "{{name}}" (and the import if nothing else needs it). Import "{{name}}" from "{{source}}" at the use site. If this file uses "{{name}}" and also exports it, keep both — that pattern is allowed.',
        avoid:
          'Do not add a fake local use (`void name`, `console.log`) to silence the rule. Do not disable the rule.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
          allowRenames: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [{ allow: [], allowRenames: DEFAULT_ALLOW_RENAMES }],
  },
  createOnce(context) {
    return {
      before() {
        const options = readNoUselessReexportOptions(context);
        if (matchesAllow(context.filename, options.allow)) {
          return false;
        }
      },
      Program(node) {
        const { allowRenames } = readNoUselessReexportOptions(context);
        const findings: Finding[] = [];
        const imported: ImportedName[] = [];
        let hasReexport = false;

        for (const statement of node.body) {
          if (statement.type === 'ImportDeclaration') {
            imported.push(...importedNames(statement));
            continue;
          }
          if (statement.type === 'ExportAllDeclaration') {
            hasReexport = true;
            const source = literalSource(statement.source) ?? '';
            findings.push({ messageId: 'starReexport', node: statement, name: '*', source });
            continue;
          }
          if (statement.type === 'ExportNamedDeclaration' && statement.source !== null) {
            hasReexport = true;
            findings.push(...collectSourceReexports(statement, allowRenames));
          }
        }

        const importedLocals = new Set(imported.map((entry) => entry.local.name));
        const exportedLocals = exportedLocalNames(node);
        for (const entry of imported) {
          if (exportedLocals.has(entry.local.name)) {
            hasReexport = true;
          }
          findings.push(...collectImportReexports(context.sourceCode, node, entry, allowRenames));
        }

        const reexportOnly =
          hasReexport && !hasSideEffectImport(node) && !hasLocalWork(node, importedLocals);
        if (reexportOnly) {
          const reportNode = findings[0]?.node ?? node;
          context.report({ node: reportNode, messageId: 'reexportFile' });
          return;
        }

        for (const finding of findings) {
          context.report({
            node: finding.node,
            messageId: finding.messageId,
            data: { name: finding.name, source: finding.source },
          });
        }
      },
    };
  },
});
