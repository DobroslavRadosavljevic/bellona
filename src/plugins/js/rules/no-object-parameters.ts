import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, SourceCode } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { lexicalTypeParameterNames } from '../shared/lexical-type-parameters.ts';

type Parameter = ESTree.ParamPattern;
type ParameterOwner =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature;

function parameterAnnotation(parameter: Parameter): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === 'TSParameterProperty') {
    return parameterAnnotation(parameter.parameter);
  }
  if (parameter.type === 'RestElement') {
    return parameter.typeAnnotation ?? parameterAnnotation(parameter.argument);
  }
  if (parameter.type === 'AssignmentPattern') {
    return parameter.typeAnnotation ?? parameter.left.typeAnnotation;
  }
  return parameter.typeAnnotation;
}

function parameterName(parameter: Parameter, sourceCode: SourceCode): string {
  return parameter.type === 'Identifier'
    ? parameter.name
    : sourceCode.getText(parameter).replace(/\s*:\s*object\s*$/u, '');
}

/** Ban the broad object type on function inputs, including local aliases to object. */
export const noObjectParametersName = bnRuleName('no-object-parameters');

export const noObjectParameters: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary.',
    },
    messages: {
      objectParameter: agentDiagnostic({
        problem:
          'Parameter `{{parameter}}` is typed as `object`. That type only means “not a primitive”. It has no fields and no owner.',
        why: 'Callers can pass any non-primitive. The function cannot name the contract, so every property access is a guess or an assertion.',
        fix: 'Give the parameter a named owner type (`User`, `LoadUserInput`, …). If the value is external, parse it at the I/O boundary with a schema, then pass the parsed type into this function.',
        avoid:
          'Do not replace `object` with `Record<string, unknown>`, `{}`, `any`, or `unknown`. Do not add `as Owner` inside the function. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    const aliases = new Map<string, ESTree.TSType>();

    const resolvesToObject = (
      type: ESTree.TSType,
      shadowedAliases: ReadonlySet<string>,
      visited = new Set<string>(),
    ): boolean => {
      if (type.type === 'TSObjectKeyword') return true;
      if (type.type === 'TSParenthesizedType')
        return resolvesToObject(type.typeAnnotation, shadowedAliases, visited);
      if (type.type === 'TSUnionType') {
        return type.types.some((member) => resolvesToObject(member, shadowedAliases, visited));
      }
      if (
        type.type !== 'TSTypeReference' ||
        type.typeName.type !== 'Identifier' ||
        (type.typeArguments !== null &&
          type.typeArguments !== undefined &&
          type.typeArguments.params.length > 0) ||
        visited.has(type.typeName.name) ||
        shadowedAliases.has(type.typeName.name)
      ) {
        return false;
      }
      const alias = aliases.get(type.typeName.name);
      if (alias === undefined) return false;
      const nextVisited = new Set(visited);
      nextVisited.add(type.typeName.name);
      return resolvesToObject(alias, shadowedAliases, nextVisited);
    };

    const checkParameters = (node: ParameterOwner) => {
      const shadowedAliases = lexicalTypeParameterNames(node, context.sourceCode.visitorKeys);
      for (const parameter of node.params) {
        const annotation = parameterAnnotation(parameter);
        if (annotation === null || annotation === undefined) continue;
        if (!resolvesToObject(annotation.typeAnnotation, shadowedAliases)) continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: 'objectParameter',
          data: { parameter: parameterName(parameter, context.sourceCode) },
        });
      }
    };

    return {
      Program(node) {
        aliases.clear();
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
          if (
            declaration?.type === 'TSTypeAliasDeclaration' &&
            (declaration.typeParameters === null || declaration.typeParameters === undefined)
          ) {
            aliases.set(declaration.id.name, declaration.typeAnnotation);
          }
        }
      },
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters,
    };
  },
});
