import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import {
  getStaticPropertyName,
  isFunctionLike,
  isGeneratorFunction,
  parentOf,
  unwrapExpression,
} from './ast.ts';
import {
  isEffectFnAppliedCall,
  isEffectFnFactoryCall,
  isEffectFnUntracedCall,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from './bindings.ts';

/**
 * Where one `effect` module comes from. `Config` comes from the `effect` barrel or
 * `effect/Config`. `HttpClient` comes from `effect/unstable/http` or
 * `effect/unstable/http/HttpClient`.
 */
export interface ModuleSource {
  /** The export name in the barrel, and the usual local name: `Config`. */
  readonly name: string;
  /** Barrels that export the module by `name`: `['effect']`. */
  readonly barrels: readonly string[];
  /** Paths that are the module itself: `['effect/Config']`. */
  readonly modules: readonly string[];
}

/** Local names that refer to one module in a file. */
export interface ModuleRefs {
  /** `Config` in `import { Config } from 'effect'` or `import * as Config from 'effect/Config'`. */
  readonly namespaces: ReadonlySet<string>;
  /** `E` in `import * as E from 'effect'`, used as `E.Config.String`. */
  readonly barrels: ReadonlySet<string>;
  /** Local name to export name for `import { String as S } from 'effect/Config'`. */
  readonly named: ReadonlyMap<string, string>;
}

export const CONFIG_MODULE: ModuleSource = {
  name: 'Config',
  barrels: ['effect'],
  modules: ['effect/Config'],
};

export const CACHE_MODULE: ModuleSource = {
  name: 'Cache',
  barrels: ['effect'],
  modules: ['effect/Cache'],
};

export const SCOPED_CACHE_MODULE: ModuleSource = {
  name: 'ScopedCache',
  barrels: ['effect'],
  modules: ['effect/ScopedCache'],
};

export const RC_MAP_MODULE: ModuleSource = {
  name: 'RcMap',
  barrels: ['effect'],
  modules: ['effect/RcMap'],
};

export const HTTP_CLIENT_MODULE: ModuleSource = {
  name: 'HttpClient',
  barrels: ['effect/unstable/http'],
  modules: ['effect/unstable/http/HttpClient'],
};

function importedName(specifier: ESTree.ImportSpecifier): string | undefined {
  const imported = specifier.imported;
  if (imported.type === 'Identifier') {
    return imported.name;
  }
  return imported.type === 'Literal' && isJsString(imported.value) ? imported.value : undefined;
}

export function collectModuleRefs(
  program: ESTree.Program | undefined,
  source: ModuleSource,
): ModuleRefs {
  const namespaces = new Set<string>();
  const barrels = new Set<string>();
  const named = new Map<string, string>();
  for (const statement of program?.body ?? []) {
    if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') {
      continue;
    }
    const from = statement.source.value;
    if (!isJsString(from)) {
      continue;
    }
    const fromBarrel = source.barrels.includes(from);
    const fromModule = source.modules.includes(from);
    if (!fromBarrel && !fromModule) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier') {
        if (specifier.importKind === 'type') {
          continue;
        }
        const name = importedName(specifier);
        if (fromBarrel && name === source.name) {
          namespaces.add(specifier.local.name);
        } else if (fromModule && name !== undefined) {
          named.set(specifier.local.name, name);
        }
        continue;
      }
      if (fromModule) {
        namespaces.add(specifier.local.name);
      } else {
        barrels.add(specifier.local.name);
      }
    }
  }
  return { namespaces, barrels, named };
}

/**
 * The export name when `node` is `Config.String`, `E.Config.String`, or a named import
 * `String` from `effect/Config`. Undefined for anything else.
 */
export function moduleMemberName(
  node: ESTree.Node | undefined,
  refs: ModuleRefs,
  source: ModuleSource,
): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') {
    return refs.named.get(expression.name);
  }
  if (expression?.type !== 'MemberExpression') {
    return undefined;
  }
  const property = getStaticPropertyName(expression.property);
  const object = unwrapExpression(expression.object);
  if (object?.type === 'Identifier') {
    return refs.namespaces.has(object.name) ? property : undefined;
  }
  if (object?.type !== 'MemberExpression') {
    return undefined;
  }
  const inner = unwrapExpression(object.object);
  return inner?.type === 'Identifier' &&
    refs.barrels.has(inner.name) &&
    getStaticPropertyName(object.property) === source.name
    ? property
    : undefined;
}

/** `Effect.log`, `Effect.logInfo`, `Effect.logError`, and the other `Effect.log*` levels. */
export const EFFECT_LOG_EXPORTS: readonly string[] = [
  'log',
  'logTrace',
  'logDebug',
  'logInfo',
  'logWarning',
  'logError',
  'logFatal',
];

/** True for `Effect.log*(…)` and `Effect.logWithLevel(level)(…)`. */
export function isEffectLogCall(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const call = unwrapExpression(node);
  if (call?.type !== 'CallExpression') {
    return false;
  }
  if (EFFECT_LOG_EXPORTS.some((name) => isModuleCall(call, bindings, 'effect', name))) {
    return true;
  }
  const callee = unwrapExpression(call.callee);
  return (
    callee?.type === 'CallExpression' && isModuleCall(callee, bindings, 'effect', 'logWithLevel')
  );
}

/** True for `Effect.log*` used as a value, such as `Effect.tapError(Effect.logError)`. */
export function isEffectLogMember(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  return EFFECT_LOG_EXPORTS.some((name) => isModuleMember(node, bindings, 'effect', name));
}

/**
 * The applied call that owns an `Effect.fn` / `Effect.fnUntraced` generator:
 * `Effect.fn("name")(function* () {})`, `Effect.fn(function* () {})`, or
 * `Effect.fnUntraced(function* () {})`. Undefined for other functions.
 */
export function effectFnOwnerCall(
  fn: ESTree.Node,
  bindings: EffectBindings,
): ESTree.CallExpression | undefined {
  if (!isGeneratorFunction(fn)) {
    return undefined;
  }
  const parent = parentOf(fn);
  if (parent?.type !== 'CallExpression' || unwrapExpression(parent.arguments[0]) !== fn) {
    return undefined;
  }
  if (
    isEffectFnAppliedCall(parent, bindings) ||
    isEffectFnUntracedCall(parent, bindings) ||
    isEffectFnFactoryCall(parent, bindings)
  ) {
    return parent;
  }
  return undefined;
}

/** True when the owner call is `Effect.fn("name")(…)`, which makes a span. */
export function isTracedFnOwner(owner: ESTree.CallExpression, bindings: EffectBindings): boolean {
  return isEffectFnAppliedCall(owner, bindings);
}

/** The nearest function that holds `node`. */
export function nearestFunction(node: ESTree.Node): ESTree.Node | undefined {
  let current = parentOf(node);
  while (current !== undefined && !isFunctionLike(current)) {
    current = parentOf(current);
  }
  return current;
}

/** Remove all whitespace, so two copies of a call compare equal when only the layout differs. */
export function normalizeSource(text: string): string {
  return text.replaceAll(/\s+/gu, '');
}
