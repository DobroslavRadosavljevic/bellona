import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import {
  getStaticMemberPath,
  getStaticPropertyName,
  isFunctionLike,
  isGeneratorFunction,
  parentOf,
  pipeRoot,
  unwrapExpression,
} from './ast.ts';

export type BindingKind =
  | 'effect'
  | 'schema'
  | 'context'
  | 'layer'
  | 'data'
  | 'predicate'
  | 'clock'
  | 'dateTime'
  | 'ref'
  | 'fiber'
  | 'deferred'
  | 'runtime'
  | 'stream'
  | 'scope';

export interface NamedBind {
  readonly kind: BindingKind;
  readonly exportName: string;
}

export interface NamespaceSets {
  readonly effect: Set<string>;
  readonly schema: Set<string>;
  readonly context: Set<string>;
  readonly layer: Set<string>;
  readonly data: Set<string>;
  readonly predicate: Set<string>;
  readonly clock: Set<string>;
  readonly dateTime: Set<string>;
  readonly ref: Set<string>;
  readonly fiber: Set<string>;
  readonly deferred: Set<string>;
  readonly runtime: Set<string>;
  readonly stream: Set<string>;
  readonly scope: Set<string>;
}

export interface EffectBindings {
  readonly namespaces: NamespaceSets;
  readonly barrelNamespaces: ReadonlySet<string>;
  readonly named: ReadonlyMap<string, NamedBind>;
  readonly vitestIt: ReadonlySet<string>;
  readonly vitestTest: ReadonlySet<string>;
}

const MODULE_KIND = new Map<string, BindingKind>([
  ['effect/Effect', 'effect'],
  ['effect/Schema', 'schema'],
  ['effect/Context', 'context'],
  ['effect/Layer', 'layer'],
  ['effect/Data', 'data'],
  ['effect/Predicate', 'predicate'],
  ['effect/Clock', 'clock'],
  ['effect/DateTime', 'dateTime'],
  ['effect/Ref', 'ref'],
  ['effect/Fiber', 'fiber'],
  ['effect/Deferred', 'deferred'],
  ['effect/Runtime', 'runtime'],
  ['effect/Stream', 'stream'],
  ['effect/Scope', 'scope'],
]);

const BARREL_KIND = new Map<string, BindingKind>([
  ['Effect', 'effect'],
  ['Schema', 'schema'],
  ['Context', 'context'],
  ['Layer', 'layer'],
  ['Data', 'data'],
  ['Predicate', 'predicate'],
  ['Clock', 'clock'],
  ['DateTime', 'dateTime'],
  ['Ref', 'ref'],
  ['Fiber', 'fiber'],
  ['Deferred', 'deferred'],
  ['Runtime', 'runtime'],
  ['Stream', 'stream'],
  ['Scope', 'scope'],
]);

function emptyNamespaces(): NamespaceSets {
  return {
    effect: new Set(),
    schema: new Set(),
    context: new Set(),
    layer: new Set(),
    data: new Set(),
    predicate: new Set(),
    clock: new Set(),
    dateTime: new Set(),
    ref: new Set(),
    fiber: new Set(),
    deferred: new Set(),
    runtime: new Set(),
    stream: new Set(),
    scope: new Set(),
  };
}

function importedName(specifier: ESTree.ImportSpecifier): string | undefined {
  const imported = specifier.imported;
  if (imported.type === 'Identifier') {
    return imported.name;
  }
  if (imported.type === 'Literal' && isJsString(imported.value)) {
    return imported.value;
  }
  return undefined;
}

/** True when the file imports `effect`, `effect/*`, or `@effect/*`. */
export function isEffectSpecifier(source: string): boolean {
  return source === 'effect' || source.startsWith('effect/') || source.startsWith('@effect/');
}

export function programImportsEffect(program: ESTree.Program | undefined): boolean {
  if (program === undefined) {
    return false;
  }
  for (const statement of program.body) {
    if (
      statement.type !== 'ImportDeclaration' &&
      statement.type !== 'ExportNamedDeclaration' &&
      statement.type !== 'ExportAllDeclaration'
    ) {
      continue;
    }
    const source = statement.source?.value;
    if (isJsString(source) && isEffectSpecifier(source)) {
      return true;
    }
  }
  return false;
}

export function collectEffectBindings(program: ESTree.Program | undefined): EffectBindings {
  const namespaces = emptyNamespaces();
  const barrelNamespaces = new Set<string>();
  const named = new Map<string, NamedBind>();
  const vitestIt = new Set<string>();
  const vitestTest = new Set<string>();
  if (program === undefined) {
    return { namespaces, barrelNamespaces, named, vitestIt, vitestTest };
  }

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (!isJsString(source)) {
      continue;
    }

    if (
      source === 'vitest' ||
      source === '@effect/vitest' ||
      source.startsWith('@effect/vitest/')
    ) {
      for (const specifier of statement.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') {
          continue;
        }
        const name = importedName(specifier);
        if (name === 'it') {
          vitestIt.add(specifier.local.name);
        }
        if (name === 'test') {
          vitestTest.add(specifier.local.name);
        }
      }
    }

    if (statement.importKind === 'type' || !isEffectSpecifier(source)) {
      continue;
    }

    const moduleKind = MODULE_KIND.get(source);
    const fromBarrel = source === 'effect';

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type') {
        continue;
      }
      if (
        specifier.type === 'ImportNamespaceSpecifier' ||
        specifier.type === 'ImportDefaultSpecifier'
      ) {
        if (fromBarrel) {
          barrelNamespaces.add(specifier.local.name);
          const kindFromLocal = BARREL_KIND.get(specifier.local.name);
          if (kindFromLocal !== undefined) {
            namespaces[kindFromLocal].add(specifier.local.name);
          }
        }
        if (moduleKind !== undefined) {
          namespaces[moduleKind].add(specifier.local.name);
        }
        continue;
      }
      if (specifier.type !== 'ImportSpecifier') {
        continue;
      }
      const exportName = importedName(specifier);
      if (exportName === undefined) {
        continue;
      }
      if (fromBarrel) {
        const kind = BARREL_KIND.get(exportName);
        if (kind !== undefined) {
          namespaces[kind].add(specifier.local.name);
          continue;
        }
      }
      if (moduleKind !== undefined) {
        named.set(specifier.local.name, { kind: moduleKind, exportName });
      }
    }
  }

  return { namespaces, barrelNamespaces, named, vitestIt, vitestTest };
}

export function isModuleMember(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
  kind: BindingKind,
  exportName: string,
): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (expression.type === 'Identifier') {
    const bind = bindings.named.get(expression.name);
    return bind !== undefined && bind.kind === kind && bind.exportName === exportName;
  }
  if (expression.type !== 'MemberExpression') {
    return false;
  }
  const property = getStaticPropertyName(expression.property);
  if (property !== exportName) {
    return false;
  }
  const object = unwrapExpression(expression.object);
  if (object?.type === 'Identifier' && bindings.namespaces[kind].has(object.name)) {
    return true;
  }
  if (object?.type === 'MemberExpression') {
    const innerProperty = getStaticPropertyName(object.property);
    const innerObject = unwrapExpression(object.object);
    const barrelKind = innerProperty === undefined ? undefined : BARREL_KIND.get(innerProperty);
    return (
      barrelKind === kind &&
      innerObject?.type === 'Identifier' &&
      bindings.barrelNamespaces.has(innerObject.name)
    );
  }
  return false;
}

export function isModuleCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
  kind: BindingKind,
  exportName: string,
): boolean {
  return isModuleMember(node.callee, bindings, kind, exportName);
}

export function isEffectGenCall(node: ESTree.CallExpression, bindings: EffectBindings): boolean {
  return isModuleCall(node, bindings, 'effect', 'gen');
}

export function isEffectFnFactoryCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  return isModuleCall(node, bindings, 'effect', 'fn');
}

export function isEffectFnUntracedCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  return (
    isModuleCall(node, bindings, 'effect', 'fnUntraced') ||
    isModuleCall(node, bindings, 'effect', 'fnUntracedEager')
  );
}

/** `Effect.fn("name")(generator, ...)`. */
export function isEffectFnAppliedCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'CallExpression' && isEffectFnFactoryCall(callee, bindings);
}

export function isEffectGenExpression(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  const root = pipeRoot(node);
  return root?.type === 'CallExpression' && isEffectGenCall(root, bindings);
}

function isItRoot(name: string, bindings: EffectBindings): boolean {
  return bindings.vitestIt.has(name) || name === 'it';
}

function isItOrTestRoot(name: string, bindings: EffectBindings): boolean {
  return isItRoot(name, bindings) || bindings.vitestTest.has(name) || name === 'test';
}

function vitestRunnerMethod(path: readonly string[], bindings: EffectBindings): string | undefined {
  if (path.length >= 2 && path[0] !== undefined && isItRoot(path[0], bindings)) {
    return path[1];
  }
  if (path.length >= 3 && path[1] === 'it') {
    return path[2];
  }
  return undefined;
}

export function isVitestEffectRunnerCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  const path = getStaticMemberPath(node.callee);
  if (path === undefined) {
    return false;
  }
  const method = vitestRunnerMethod(path, bindings);
  return method === 'effect' || method === 'live';
}

export function isScopedLiveCall(node: ESTree.CallExpression, bindings: EffectBindings): boolean {
  const path = getStaticMemberPath(node.callee);
  if (path === undefined) {
    return false;
  }
  const method = vitestRunnerMethod(path, bindings);
  return method === 'scopedLive';
}

export function isBareVitestItCall(node: ESTree.CallExpression, bindings: EffectBindings): boolean {
  const path = getStaticMemberPath(node.callee);
  if (path === undefined || path[0] === undefined || !isItOrTestRoot(path[0], bindings)) {
    return false;
  }
  const method = vitestRunnerMethod(path, bindings);
  return method !== 'effect' && method !== 'live' && method !== 'scopedLive';
}

/** True when a call is `Effect.<export>(...)` other than `fn` / `fnUntraced`. */
export function isEffectNamespaceCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type === 'Identifier') {
    const bind = bindings.named.get(callee.name);
    return (
      bind !== undefined &&
      bind.kind === 'effect' &&
      bind.exportName !== 'fn' &&
      bind.exportName !== 'fnUntraced'
    );
  }
  if (callee?.type !== 'MemberExpression') {
    return false;
  }
  const property = getStaticPropertyName(callee.property);
  if (property === undefined || property === 'fn' || property === 'fnUntraced') {
    return false;
  }
  const object = unwrapExpression(callee.object);
  if (object?.type === 'Identifier' && bindings.namespaces.effect.has(object.name)) {
    return true;
  }
  if (object?.type === 'MemberExpression') {
    const innerProperty = getStaticPropertyName(object.property);
    const innerObject = unwrapExpression(object.object);
    return (
      innerProperty === 'Effect' &&
      innerObject?.type === 'Identifier' &&
      bindings.barrelNamespaces.has(innerObject.name)
    );
  }
  return false;
}

function callHasFnArg(call: ESTree.CallExpression, fn: ESTree.Node): boolean {
  return call.arguments.some((argument) => {
    if (argument.type === 'SpreadElement') {
      return false;
    }
    return unwrapExpression(argument) === fn;
  });
}

export function isInsideVitestEffectCallback(node: ESTree.Node, bindings: EffectBindings): boolean {
  let current: ESTree.Node | undefined = node;
  while (current !== undefined) {
    if (isFunctionLike(current)) {
      const parent = parentOf(current);
      if (
        parent?.type === 'CallExpression' &&
        callHasFnArg(parent, current) &&
        isVitestEffectRunnerCall(parent, bindings)
      ) {
        return true;
      }
    }
    current = parentOf(current);
  }
  return false;
}

export function isContextServiceMember(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  return isModuleMember(node, bindings, 'context', 'Service');
}

/** `Context.Service("id")` function-style key. */
export function isContextServiceValueCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  return isContextServiceMember(node.callee, bindings) && node.arguments.length > 0;
}

/**
 * `Context.Service<Self, Shape>()("id")` class-style key.
 * The outer call holds the identifier string.
 */
export function isContextServiceClassKeyCall(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): boolean {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'CallExpression') {
    return false;
  }
  if (!isContextServiceMember(callee.callee, bindings)) {
    return false;
  }
  return callee.arguments.length === 0 && node.arguments.length > 0;
}

export function serviceIdLiteral(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): string | undefined {
  if (!isContextServiceValueCall(node, bindings) && !isContextServiceClassKeyCall(node, bindings)) {
    return undefined;
  }
  const first = node.arguments[0];
  if (first === undefined || first.type === 'SpreadElement') {
    return undefined;
  }
  const expression = unwrapExpression(first);
  if (expression?.type === 'Literal' && isJsString(expression.value)) {
    return expression.value;
  }
  return undefined;
}

export function isContextServiceClassSuper(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): node is ESTree.CallExpression {
  const expression = unwrapExpression(node);
  return (
    expression?.type === 'CallExpression' && isContextServiceClassKeyCall(expression, bindings)
  );
}

export function generatorFromEffectGenOrFn(
  node: ESTree.Node,
  bindings: EffectBindings,
): ESTree.Node | undefined {
  let current: ESTree.Node | undefined = node;
  while (current !== undefined) {
    if (isGeneratorFunction(current)) {
      const parent = parentOf(current);
      if (parent?.type === 'CallExpression' && callHasFnArg(parent, current)) {
        if (
          isEffectGenCall(parent, bindings) ||
          isEffectFnAppliedCall(parent, bindings) ||
          isEffectFnUntracedCall(parent, bindings)
        ) {
          return current;
        }
      }
    }
    current = parentOf(current);
  }
  return undefined;
}

export function isEffectFailLikeCall(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  if (node?.type !== 'CallExpression') {
    return false;
  }
  return (
    isModuleCall(node, bindings, 'effect', 'fail') ||
    isModuleCall(node, bindings, 'effect', 'failSync') ||
    isModuleCall(node, bindings, 'effect', 'die') ||
    isModuleCall(node, bindings, 'effect', 'dieMessage')
  );
}

const BUILTIN_ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'EvalError',
  'URIError',
  'AggregateError',
]);

export function isTaggedErrorConstruct(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'NewExpression') {
    return false;
  }
  const callee = unwrapExpression(expression.callee);
  if (callee?.type !== 'Identifier') {
    return false;
  }
  if (BUILTIN_ERROR_NAMES.has(callee.name)) {
    return false;
  }
  if (callee.name.endsWith('Error')) {
    return true;
  }
  let current: ESTree.Node | undefined = expression;
  while (current !== undefined && current.type !== 'Program') {
    current = parentOf(current);
  }
  if (current?.type !== 'Program') {
    return false;
  }
  for (const statement of current.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (
      declaration === null ||
      declaration === undefined ||
      declaration.type !== 'ClassDeclaration'
    ) {
      continue;
    }
    if (declaration.id?.name !== callee.name) {
      continue;
    }
    return isModuleMember(
      calleeRoot(declaration.superClass ?? undefined),
      bindings,
      'schema',
      'TaggedError',
    );
  }
  return false;
}

function calleeRoot(node: ESTree.Node | undefined): ESTree.Node | undefined {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    current = unwrapExpression(current.callee);
  }
  return current;
}
