import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import { getStaticPropertyName, unwrapExpression } from './ast.ts';

/**
 * Local names for one `effect` module that `bindings.ts` does not track, such as
 * `Schedule`, `Cause`, `Exit`, or `ManagedRuntime`.
 */
export interface ModuleNames {
  /** `Schedule` in `import { Schedule } from 'effect'` or `import * as Schedule from 'effect/Schedule'`. */
  readonly namespaces: ReadonlySet<string>;
  /** `E` in `import * as E from 'effect'`, used as `E.Schedule.spaced`. */
  readonly barrels: ReadonlySet<string>;
  /** Local name → export name for `import { spaced } from 'effect/Schedule'`. */
  readonly named: ReadonlyMap<string, string>;
}

function importedName(specifier: ESTree.ImportSpecifier): string | undefined {
  const imported = specifier.imported;
  if (imported.type === 'Identifier') {
    return imported.name;
  }
  return imported.type === 'Literal' && isJsString(imported.value) ? imported.value : undefined;
}

export function collectModuleNames(
  program: ESTree.Program | undefined,
  moduleName: string,
): ModuleNames {
  const namespaces = new Set<string>();
  const barrels = new Set<string>();
  const named = new Map<string, string>();
  for (const statement of program?.body ?? []) {
    if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') {
      continue;
    }
    const source = statement.source.value;
    if (source !== 'effect' && source !== `effect/${moduleName}`) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') {
        (source === 'effect' ? barrels : namespaces).add(specifier.local.name);
        continue;
      }
      if (specifier.importKind === 'type') {
        continue;
      }
      const exportName = importedName(specifier);
      if (source === 'effect' && exportName === moduleName) {
        namespaces.add(specifier.local.name);
      } else if (source !== 'effect' && exportName !== undefined) {
        named.set(specifier.local.name, exportName);
      }
    }
  }
  return { namespaces, barrels, named };
}

/** True for `Schedule.spaced`, `E.Schedule.spaced`, or a named import `spaced`. */
export function isModuleNameMember(
  node: ESTree.Node | undefined,
  names: ModuleNames,
  moduleName: string,
  exportName: string,
): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') {
    return names.named.get(expression.name) === exportName;
  }
  if (
    expression?.type !== 'MemberExpression' ||
    getStaticPropertyName(expression.property) !== exportName
  ) {
    return false;
  }
  const object = unwrapExpression(expression.object);
  if (object?.type === 'Identifier') {
    return names.namespaces.has(object.name);
  }
  if (object?.type !== 'MemberExpression') {
    return false;
  }
  const root = unwrapExpression(object.object);
  return (
    getStaticPropertyName(object.property) === moduleName &&
    root?.type === 'Identifier' &&
    names.barrels.has(root.name)
  );
}

/** The export name when `node` is any member of the module (`Schedule.<name>`). */
export function moduleNameMemberOf(
  node: ESTree.Node | undefined,
  names: ModuleNames,
  moduleName: string,
): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') {
    return names.named.get(expression.name);
  }
  if (expression?.type !== 'MemberExpression') {
    return undefined;
  }
  const name = getStaticPropertyName(expression.property);
  return name !== undefined && isModuleNameMember(expression, names, moduleName, name)
    ? name
    : undefined;
}
