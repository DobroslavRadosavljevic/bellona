import type { CreateOnceRule, ESTree, SourceCode, Variable } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, isAllowedFile } from '../options.ts';
import {
  classifyWideningTarget,
  createTypeEnvironment,
  type TypeEnvironment,
} from '../shared/dictionary-types.ts';
import {
  isGlobalObjectMethodCall,
  resolveVariable,
  staticPropertyName,
  unwrapParentheses,
} from '../shared/scope.ts';

type Scope = ESTree.Program | ESTree.ArrowFunctionExpression | ESTree.Function;

interface Guard {
  readonly scope: Scope;
  readonly table: Variable;
  readonly key: string;
}

/** `table[key] = value`: after it runs, `key` is an own key of the table. */
interface Write {
  readonly table: Variable;
  readonly key: string;
  readonly end: number;
}

interface Lookup {
  readonly node: ESTree.MemberExpression;
  readonly table: Variable;
  readonly key: string;
}

const hasOwnMethods: ReadonlySet<string> = new Set(['hasOwn']);
const keyListMethods: ReadonlySet<string> = new Set(['entries', 'keys']);
const hasOwnPropertyCallees: ReadonlySet<string> = new Set([
  'Object.prototype.hasOwnProperty.call',
  '{}.hasOwnProperty.call',
]);

function normalizedText(sourceCode: SourceCode, node: ESTree.Node): string {
  return sourceCode.getText(node).replaceAll(/\s+/gu, '');
}

function isStaticKey(key: ESTree.Expression): boolean {
  return key.type === 'Literal' || (key.type === 'TemplateLiteral' && key.expressions.length === 0);
}

function hasNullPrototype(object: ESTree.ObjectExpression): boolean {
  return object.properties.some(
    (property) =>
      property.type === 'Property' &&
      !property.computed &&
      ((property.key.type === 'Identifier' && property.key.name === '__proto__') ||
        (property.key.type === 'Literal' && property.key.value === '__proto__')) &&
      property.value.type === 'Literal' &&
      property.value.value === null,
  );
}

function enclosingScope(node: ESTree.Node): Scope {
  let current: ESTree.Node | null = node.parent;
  while (current !== null) {
    if (
      current.type === 'Program' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression'
    ) {
      return current;
    }
    current = current.parent;
  }
  throw new Error('A node outside a Program has no scope');
}

function scopeChain(node: ESTree.Node): readonly Scope[] {
  const chain: Scope[] = [];
  let scope = enclosingScope(node);
  chain.push(scope);
  while (scope.type !== 'Program') {
    scope = enclosingScope(scope);
    chain.push(scope);
  }
  return chain;
}

/**
 * A `const` declared with an open dictionary type (`Record<string, V>`,
 * `{ [key: string]: V }`, or a local alias of one) and an object literal. The
 * literal inherits `Object.prototype`, so `table["constructor"]` is a function.
 */
function isPrototypeDictionary(variable: Variable, environment: TypeEnvironment): boolean {
  if (variable.defs.length !== 1) return false;
  const [definition] = variable.defs;
  if (definition?.type !== 'Variable' || definition.node.type !== 'VariableDeclarator') {
    return false;
  }
  const declarator = definition.node;
  if (
    declarator.parent.type !== 'VariableDeclaration' ||
    declarator.parent.kind !== 'const' ||
    declarator.id.type !== 'Identifier' ||
    declarator.init === null
  ) {
    return false;
  }
  const init = unwrapParentheses(declarator.init);
  if (init.type !== 'ObjectExpression' || hasNullPrototype(init)) return false;
  const annotation = declarator.id.typeAnnotation?.typeAnnotation;
  if (annotation === undefined) return false;
  const target = classifyWideningTarget(annotation, environment);
  return target?.kind === 'open dictionary' || target?.kind === 'generic container';
}

function isKeyListOf(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  table: Variable,
): boolean {
  const call = unwrapParentheses(expression);
  if (
    call.type !== 'CallExpression' ||
    !isGlobalObjectMethodCall(sourceCode, call, keyListMethods)
  ) {
    return false;
  }
  const [argument] = call.arguments;
  return argument?.type === 'Identifier' && resolveVariable(sourceCode, argument) === table;
}

/**
 * Keys that come from the table itself are own keys: `for (const key in table)`,
 * `for (const key of Object.keys(table))`, and a callback on `Object.keys(table)`.
 */
function isOwnKeyBinding(sourceCode: SourceCode, key: ESTree.Expression, table: Variable): boolean {
  if (key.type !== 'Identifier') return false;
  const variable = resolveVariable(sourceCode, key);
  const [definition] = variable?.defs ?? [];
  if (definition === undefined) return false;
  const declaration: ESTree.Node | null = definition.node.parent;

  if (definition.type === 'Variable' && declaration?.type === 'VariableDeclaration') {
    const loop = declaration.parent;
    if (loop?.type === 'ForInStatement') {
      const right = unwrapParentheses(loop.right);
      return right.type === 'Identifier' && resolveVariable(sourceCode, right) === table;
    }
    if (loop?.type === 'ForOfStatement') return isKeyListOf(sourceCode, loop.right, table);
    return false;
  }

  if (definition.type !== 'Parameter') return false;
  const callback = definition.node;
  const call = callback.parent;
  if (
    call?.type !== 'CallExpression' ||
    call.arguments[0] !== callback ||
    call.callee.type !== 'MemberExpression'
  ) {
    return false;
  }
  return isKeyListOf(sourceCode, call.callee.object, table);
}

/** Ban runtime-key reads of object-literal dictionaries without an own-key check. */
export const requireOwnKeyLookupName = bnRuleName('require-own-key-lookup');

export const requireOwnKeyLookup: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require an own-key check before reading an object-literal Record<string, V> by a runtime key.',
    },
    messages: {
      ownKeyLookup: agentDiagnostic({
        problem:
          '`{{table}}[{{key}}]` reads an object-literal dictionary by a runtime key, and this function has no own-key check for that key.',
        why: 'An object literal inherits `Object.prototype`. A key such as `constructor` or `toString` returns an inherited function, but TypeScript types the result as the value type. The `in` operator also finds inherited keys, so it is not an own-key check.',
        fix: 'Check the key first: `Object.hasOwn({{table}}, {{key}}) ? {{table}}[{{key}}] : undefined`. Or keep the entries in a `Map` and use `get`, or create the table with `Object.create(null)`.',
        avoid:
          'Do not use `{{key}} in {{table}}` as the check. Do not assert the result. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let environment: TypeEnvironment | null = null;
    let lookups: Lookup[] = [];
    let writes: Write[] = [];
    let guards: Guard[] = [];
    const dictionaryCache = new Map<Variable, boolean>();

    const addGuard = (
      node: ESTree.Node,
      tableNode: ESTree.Argument | undefined,
      keyNode: ESTree.Argument | undefined,
    ) => {
      if (tableNode?.type !== 'Identifier' || keyNode === undefined) return;
      const table = resolveVariable(context.sourceCode, tableNode);
      if (table === null) return;
      guards.push({
        scope: enclosingScope(node),
        table,
        key: normalizedText(context.sourceCode, keyNode),
      });
    };

    const isDictionary = (table: Variable): boolean => {
      const cached = dictionaryCache.get(table);
      if (cached !== undefined) return cached;
      const result = environment !== null && isPrototypeDictionary(table, environment);
      dictionaryCache.set(table, result);
      return result;
    };

    return {
      before() {
        if (isAllowedFile(context)) return false;
        environment = null;
        lookups = [];
        writes = [];
        guards = [];
        dictionaryCache.clear();
      },
      Program(node) {
        environment = createTypeEnvironment(node);
      },
      CallExpression(node) {
        const [first, second] = node.arguments;
        if (isGlobalObjectMethodCall(context.sourceCode, node, hasOwnMethods)) {
          addGuard(node, first, second);
          return;
        }
        const { callee } = node;
        if (callee.type !== 'MemberExpression') return;
        if (hasOwnPropertyCallees.has(normalizedText(context.sourceCode, callee))) {
          addGuard(node, first, second);
          return;
        }
        if (staticPropertyName(callee) === 'hasOwnProperty') addGuard(node, callee.object, first);
      },
      MemberExpression(node) {
        if (!node.computed || node.object.type !== 'Identifier' || isStaticKey(node.property)) {
          return;
        }
        const table = resolveVariable(context.sourceCode, node.object);
        if (table === null || !isDictionary(table)) return;
        const key = normalizedText(context.sourceCode, node.property);
        const { parent } = node;
        if (
          parent?.type === 'AssignmentExpression' &&
          parent.left === node &&
          parent.operator === '='
        ) {
          writes.push({ table, key, end: parent.end });
          return;
        }
        if (isOwnKeyBinding(context.sourceCode, node.property, table)) return;
        lookups.push({ node, table, key });
      },
      'Program:exit'() {
        for (const lookup of lookups) {
          const scopes = scopeChain(lookup.node);
          const guarded = guards.some(
            (guard) =>
              guard.table === lookup.table &&
              guard.key === lookup.key &&
              scopes.includes(guard.scope),
          );
          const writtenBefore = writes.some(
            (write) =>
              write.table === lookup.table &&
              write.key === lookup.key &&
              write.end <= lookup.node.start,
          );
          if (guarded || writtenBefore) continue;
          context.report({
            node: lookup.node,
            messageId: 'ownKeyLookup',
            data: {
              table: lookup.table.name,
              key: context.sourceCode.getText(lookup.node.property),
            },
          });
        }
      },
    };
  },
});
