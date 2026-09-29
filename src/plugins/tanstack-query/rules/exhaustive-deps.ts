import type { CreateOnceRule, ESTree, Reference, Variable } from '@oxlint/plugins';

import { isAstNode } from '../../../lib/ast-node.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { propertyName, unwrap, variableFor } from '../ast.ts';
import { isQueryClient } from '../evidence.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';
import { isFunctionNode, type FunctionNode } from '../react.ts';

/** Type positions. A type name is not a runtime value, so the key does not need it. */
const TYPE_PARENTS = new Set([
  'TSTypeReference',
  'TSTypeQuery',
  'TSQualifiedName',
  'TSClassImplements',
  'TSInterfaceHeritage',
  'TSImportType',
]);

function objectProperty(node: ESTree.ObjectExpression, name: string): ESTree.Node | undefined {
  for (const property of node.properties) {
    if (property.type === 'Property' && propertyName(property.key, property.computed) === name)
      return property.value;
  }
  return undefined;
}

/** Query functions in `queryFn`, also both branches of `enabled ? fn : skipToken`. */
function queryFunctions(node: ESTree.Node | undefined): FunctionNode[] {
  const value = unwrap(node);
  if (isFunctionNode(value)) return [value];
  if (value?.type === 'ConditionalExpression')
    return [...queryFunctions(value.consequent), ...queryFunctions(value.alternate)];
  return [];
}

/**
 * `api.get(id)`: `api` is the root of a callee. Like the official rule, a called function or a
 * method owner does not need to be in the key.
 */
function isCalleeRoot(identifier: ESTree.Node): boolean {
  let current: ESTree.Node = identifier;
  let parent = current.parent ?? undefined;
  while (parent?.type === 'MemberExpression' && parent.object === current) {
    current = parent;
    parent = current.parent ?? undefined;
  }
  return (
    (parent?.type === 'CallExpression' || parent?.type === 'NewExpression') &&
    parent.callee === current
  );
}

/** A function, class, or import does not change between renders like data does. */
function isStableDefinition(variable: Variable): boolean {
  return variable.defs.every((definition) => {
    if (
      definition.type === 'FunctionName' ||
      definition.type === 'ClassName' ||
      definition.type === 'ImportBinding'
    )
      return true;
    if (definition.type !== 'Variable' || definition.node.type !== 'VariableDeclarator')
      return false;
    return isFunctionNode(unwrap(definition.node.init));
  });
}

/**
 * Variables that the key reads. A local variable in the key also brings in the variables of its
 * initializer: `const options = { path: { id } }` then `queryKey: [keyOf(options)]` covers `id`.
 */
function collectKeyVariables(
  node: ESTree.Node,
  lookup: (identifier: ESTree.Node) => Variable | undefined,
  out: Set<Variable>,
): void {
  if (node.type === 'Identifier') {
    const variable = lookup(node);
    if (variable === undefined || out.has(variable)) return;
    out.add(variable);
    const definition = variable.defs.length === 1 ? variable.defs[0] : undefined;
    if (
      definition?.type === 'Variable' &&
      definition.node.type === 'VariableDeclarator' &&
      definition.node.init != null &&
      variable.scope.type !== 'module' &&
      variable.scope.type !== 'global'
    )
      collectKeyVariables(definition.node.init, lookup, out);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) if (isAstNode(child)) collectKeyVariables(child, lookup, out);
  }
}

export const exhaustiveDepsName = bnRuleName('exhaustive-deps');
export const exhaustiveDeps: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require values that `queryFn` reads from its enclosing scope in the `queryKey`',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      missing: agentDiagnostic({
        problem: '`queryFn` reads `{{name}}`, but the inline `queryKey` does not include it.',
        why: 'Query caches data by `queryKey`. When `{{name}}` changes, the key stays the same, so the query shows old data and does not fetch again.',
        fix: 'Add `{{name}}` to the `queryKey` array, for example `queryKey: ["todos", {{name}}]`.',
        avoid:
          'Do not read the value from a ref or a closure to hide it from the key. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    function lookup(identifier: ESTree.Node): Variable | undefined {
      return variableFor(context.sourceCode, identifier);
    }

    /** A reference that the key must include: data from the enclosing function scope. */
    function isDependency(reference: Reference): reference is Reference & { resolved: Variable } {
      const variable = reference.resolved;
      if (variable === null) return false;
      const scopeType = variable.scope.type;
      if (scopeType === 'module' || scopeType === 'global') return false;
      if (isStableDefinition(variable)) return false;
      const identifier = reference.identifier;
      const parent = identifier.parent ?? undefined;
      if (parent !== undefined && TYPE_PARENTS.has(parent.type)) return false;
      if (isCalleeRoot(identifier)) return false;
      return !isQueryClient(context, identifier);
    }

    return {
      before() {
        if (skipFile(context)) return false;
      },
      ObjectExpression(node) {
        const queryKey = unwrap(objectProperty(node, 'queryKey'));
        if (queryKey?.type !== 'ArrayExpression') return;
        const functions = queryFunctions(objectProperty(node, 'queryFn'));
        if (functions.length === 0) return;
        const scopeManager = context.sourceCode.scopeManager;
        const inKey = new Set<Variable>();
        collectKeyVariables(queryKey, lookup, inKey);
        const reported = new Set<Variable>();
        for (const fn of functions) {
          const scope = scopeManager.acquire(fn);
          if (scope === null) continue;
          for (const reference of scope.through) {
            if (!isDependency(reference)) continue;
            const variable = reference.resolved;
            if (inKey.has(variable) || reported.has(variable)) continue;
            reported.add(variable);
            context.report({ node: queryKey, messageId: 'missing', data: { name: variable.name } });
          }
        }
      },
    };
  },
});
