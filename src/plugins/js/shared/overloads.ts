import type { ESTree } from '@oxlint/plugins';

type StatementContainer = ESTree.Program | ESTree.BlockStatement | ESTree.TSModuleBlock;

function declaredFunction(statement: ESTree.Node): ESTree.Function | null {
  const declaration =
    statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
      ? statement.declaration
      : statement;
  return declaration?.type === 'FunctionDeclaration' || declaration?.type === 'TSDeclareFunction'
    ? declaration
    : null;
}

function statementContainer(node: ESTree.Function): StatementContainer | null {
  let parent: ESTree.Node | null = node.parent;
  if (parent?.type === 'ExportNamedDeclaration' || parent?.type === 'ExportDefaultDeclaration') {
    parent = parent.parent;
  }
  return parent?.type === 'Program' ||
    parent?.type === 'BlockStatement' ||
    parent?.type === 'TSModuleBlock'
    ? parent
    : null;
}

function hasFunctionOverloadSignature(node: ESTree.Function): boolean {
  const name = node.id?.name;
  const container = statementContainer(node);
  if (name === undefined || container === null) return false;
  const statements: readonly ESTree.Node[] = container.body;
  return statements.some((statement) => {
    const declaration = declaredFunction(statement);
    return declaration?.type === 'TSDeclareFunction' && declaration.id?.name === name;
  });
}

function memberKeyName(member: ESTree.Node): string | null {
  if (
    (member.type !== 'MethodDefinition' && member.type !== 'TSAbstractMethodDefinition') ||
    member.computed
  ) {
    return null;
  }
  const { key } = member;
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') return key.name;
  return key.type === 'Literal' ? String(key.value) : null;
}

function hasMethodOverloadSignature(node: ESTree.Function): boolean {
  const method = node.parent;
  if (method?.type !== 'MethodDefinition' || method.value !== node) return false;
  const name = memberKeyName(method);
  const body = method.parent;
  if (name === null || body?.type !== 'ClassBody') return false;
  return body.body.some(
    (member) =>
      member !== method &&
      (member.type === 'MethodDefinition' || member.type === 'TSAbstractMethodDefinition') &&
      member.static === method.static &&
      member.value.type === 'TSEmptyBodyFunctionExpression' &&
      memberKeyName(member) === name,
  );
}

/**
 * Reports whether a function body is the implementation of an overloaded
 * function or method. Callers see only the overload signatures. The
 * implementation signature is not visible from outside, so its broad
 * parameter and return types are not a public contract.
 * @see https://www.typescriptlang.org/docs/handbook/2/functions.html#overload-signatures-and-the-implementation-signature
 */
export function isOverloadImplementation(node: ESTree.Node): boolean {
  if (node.type !== 'FunctionDeclaration' && node.type !== 'FunctionExpression') return false;
  if (node.body === null) return false;
  return hasFunctionOverloadSignature(node) || hasMethodOverloadSignature(node);
}
