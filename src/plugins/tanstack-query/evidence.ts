import type { Context, ESTree, SourceCode } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../lib/options.ts';
import { propertyName, stableDeclaration, unwrap, variableFor } from './ast.ts';

export const QUERY_MODULES = new Set(['@tanstack/react-query', '@tanstack/query-core']);
export const QUERY_HOOKS = new Set([
  'useQuery',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseInfiniteQuery',
]);
export const QUERY_OPTIONS = new Set([
  ...QUERY_HOOKS,
  'queryOptions',
  'infiniteQueryOptions',
  'usePrefetchQuery',
  'usePrefetchInfiniteQuery',
]);
export const MUTATION_OPTIONS = new Set(['useMutation', 'mutationOptions']);
export const CLIENT_FETCH_METHODS = new Set([
  'query',
  'infiniteQuery',
  'fetchQuery',
  'fetchInfiniteQuery',
  'prefetchQuery',
  'prefetchInfiniteQuery',
  'ensureQueryData',
  'ensureInfiniteQueryData',
]);
export const FILTER_METHODS = new Set([
  'isFetching',
  'isMutating',
  'getQueriesData',
  'setQueriesData',
  'removeQueries',
  'resetQueries',
  'cancelQueries',
  'invalidateQueries',
  'refetchQueries',
]);

/** Resolve imports through lexical scope, so local names cannot impersonate library APIs. */
export function importedName(
  source: SourceCode,
  node: ESTree.Node | null | undefined,
  seen = new Set<ESTree.Node>(),
): string | undefined {
  const value = unwrap(node);
  if (value === undefined || seen.has(value)) return undefined;
  seen.add(value);
  if (
    value.type === 'MemberExpression' ||
    value.type === 'JSXMemberExpression' ||
    value.type === 'TSQualifiedName'
  ) {
    const object = value.type === 'TSQualifiedName' ? value.left : value.object;
    const property = value.type === 'TSQualifiedName' ? value.right : value.property;
    return importedName(source, object, seen) === '*'
      ? propertyName(property, value.type === 'MemberExpression' && value.computed)
      : undefined;
  }
  const variable = variableFor(source, value);
  if (variable?.defs.length !== 1) return undefined;
  const definition = variable.defs[0];
  if (definition?.type === 'ImportBinding') {
    const declaration = definition.parent;
    if (
      declaration?.type !== 'ImportDeclaration' ||
      !QUERY_MODULES.has(String(declaration.source.value))
    )
      return undefined;
    const specifier = definition.node;
    if (specifier.type === 'ImportNamespaceSpecifier') return '*';
    return specifier.type === 'ImportSpecifier' ? propertyName(specifier.imported) : undefined;
  }
  const declaration = stableDeclaration(source, value);
  if (
    declaration?.id.type === 'ObjectPattern' &&
    value.type === 'Identifier' &&
    importedName(source, declaration.init, seen) === '*'
  ) {
    const matchedProperty = declaration.id.properties.find(
      (property) =>
        property.type === 'Property' &&
        property.value.type === 'Identifier' &&
        property.value.name === value.name,
    );
    return matchedProperty?.type === 'Property'
      ? propertyName(matchedProperty.key, matchedProperty.computed)
      : undefined;
  }
  return declaration?.id.type === 'Identifier'
    ? importedName(source, declaration.init, seen)
    : undefined;
}

function hasClientType(source: SourceCode, node: ESTree.Node): boolean {
  if (!('typeAnnotation' in node)) return false;
  const annotation = node.typeAnnotation;
  return (
    annotation?.type === 'TSTypeAnnotation' &&
    annotation.typeAnnotation.type === 'TSTypeReference' &&
    importedName(source, annotation.typeAnnotation.typeName) === 'QueryClient'
  );
}

export function isQueryClient(
  context: Context,
  node: ESTree.Node | null | undefined,
  seen = new Set<ESTree.Node>(),
): boolean {
  const value = unwrap(node);
  if (value === undefined || seen.has(value)) return false;
  seen.add(value);
  if (value.type === 'NewExpression')
    return importedName(context.sourceCode, value.callee) === 'QueryClient';
  if (value.type === 'CallExpression')
    return importedName(context.sourceCode, value.callee) === 'useQueryClient';
  if (value.type === 'Identifier') {
    const variable = variableFor(context.sourceCode, value);
    if (variable?.identifiers.some((identifier) => hasClientType(context.sourceCode, identifier)))
      return true;
    const declaration = stableDeclaration(context.sourceCode, value);
    if (declaration?.id.type === 'Identifier' && declaration.init != null)
      return isQueryClient(context, declaration.init, seen);
    if (declaration?.id.type === 'ObjectPattern') {
      const names = stringListField(objectOptionAt(context, 0), 'queryClientNames', [
        'queryClient',
      ]);
      return declaration.id.properties.some(
        (property) =>
          property.type === 'Property' &&
          property.value.type === 'Identifier' &&
          property.value.name === value.name &&
          names.includes(propertyName(property.key, property.computed) ?? ''),
      );
    }
    // An explicit local object with the same name is not a QueryClient.
    if (variable?.defs.some((definition) => definition.type === 'Variable')) return false;
  }
  const names = stringListField(objectOptionAt(context, 0), 'queryClientNames', ['queryClient']);
  const name =
    value.type === 'MemberExpression'
      ? propertyName(value.property, value.computed)
      : value.type === 'Identifier'
        ? value.name
        : undefined;
  return name !== undefined && names.includes(name);
}

export function clientMethod(context: Context, node: ESTree.Node): string | undefined {
  const value = unwrap(node);
  return value?.type === 'MemberExpression' && isQueryClient(context, value.object)
    ? propertyName(value.property, value.computed)
    : undefined;
}

export function resultKind(
  source: SourceCode,
  node: ESTree.Node | null | undefined,
  seen = new Set<ESTree.Node>(),
): 'query' | 'mutation' | undefined {
  const value = unwrap(node);
  if (value === undefined || seen.has(value)) return undefined;
  seen.add(value);
  if (value.type === 'CallExpression') {
    const name = importedName(source, value.callee);
    if (name !== undefined && QUERY_HOOKS.has(name)) return 'query';
    if (name === 'useMutation') return 'mutation';
  }
  if (value.type === 'Identifier') {
    const declaration = stableDeclaration(source, value);
    if (declaration?.id.type === 'Identifier') return resultKind(source, declaration.init, seen);
  }
  return undefined;
}
