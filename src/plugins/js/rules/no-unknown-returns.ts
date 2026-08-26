import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { lexicalTypeParameterNames } from '../shared/lexical-type-parameters.ts';

type FunctionWithReturnType =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature;

function referencedAliasName(type: ESTree.TSType): string | null {
  if (type.type === 'TSParenthesizedType') return referencedAliasName(type.typeAnnotation);
  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') return null;
  return type.typeArguments === null ||
    type.typeArguments === undefined ||
    type.typeArguments.params.length === 0
    ? type.typeName.name
    : null;
}

/** Ban function contracts that return unknown instead of a parsed domain type. */
export const noUnknownReturnsName = bnRuleName('no-unknown-returns');

export const noUnknownReturns: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow functions whose explicit return contract is unknown or Promise<unknown>.',
    },
    messages: {
      unknownReturn: agentDiagnostic({
        problem:
          'This function (or signature) declares a return type of `unknown` or `Promise<unknown>`.',
        why: 'The caller then receives unparsed data and must guess or assert. The parse belongs at the boundary that produced the value, not in every consumer.',
        fix: 'Parse before returning, then declare a named domain type (`User`, `LoadResult`, …). For async work, return `Promise<NamedType>` after parse.',
        avoid:
          'Do not return `any`, `object`, or `Record<string, unknown>` as a substitute. Do not keep `unknown` and add `as NamedType` at each call site. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    const aliases = new Map<string, ESTree.TSTypeAliasDeclaration>();

    const resolvesToUnknown = (
      type: ESTree.TSType,
      shadowedAliases: ReadonlySet<string>,
      visited = new Set<string>(),
    ): boolean => {
      if (type.type === 'TSUnknownKeyword') return true;
      if (type.type === 'TSParenthesizedType') {
        return resolvesToUnknown(type.typeAnnotation, shadowedAliases, visited);
      }
      if (type.type === 'TSUnionType') {
        return type.types.some((member) => resolvesToUnknown(member, shadowedAliases, visited));
      }
      if (
        type.type === 'TSTypeReference' &&
        type.typeName.type === 'Identifier' &&
        (type.typeName.name === 'Promise' || type.typeName.name === 'PromiseLike')
      ) {
        const value = type.typeArguments?.params[0];
        return value !== undefined && resolvesToUnknown(value, shadowedAliases, visited);
      }
      const name = referencedAliasName(type);
      if (name === null || visited.has(name) || shadowedAliases.has(name)) return false;
      const alias = aliases.get(name);
      if (
        alias === undefined ||
        (alias.typeParameters !== null && alias.typeParameters !== undefined)
      ) {
        return false;
      }
      const nextVisited = new Set(visited);
      nextVisited.add(name);
      return resolvesToUnknown(alias.typeAnnotation, shadowedAliases, nextVisited);
    };

    const checkReturnType = (node: FunctionWithReturnType) => {
      const annotation = node.returnType;
      if (annotation === null || annotation === undefined) return;
      if (
        !resolvesToUnknown(
          annotation.typeAnnotation,
          lexicalTypeParameterNames(node, context.sourceCode.visitorKeys),
        )
      ) {
        return;
      }
      context.report({ node: annotation.typeAnnotation, messageId: 'unknownReturn' });
    };

    return {
      Program(node) {
        aliases.clear();
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
          if (declaration?.type === 'TSTypeAliasDeclaration') {
            aliases.set(declaration.id.name, declaration);
          }
        }
      },
      ArrowFunctionExpression: checkReturnType,
      FunctionDeclaration: checkReturnType,
      FunctionExpression: checkReturnType,
      TSCallSignatureDeclaration: checkReturnType,
      TSConstructSignatureDeclaration: checkReturnType,
      TSConstructorType: checkReturnType,
      TSDeclareFunction: checkReturnType,
      TSEmptyBodyFunctionExpression: checkReturnType,
      TSFunctionType: checkReturnType,
      TSMethodSignature: checkReturnType,
    };
  },
});
