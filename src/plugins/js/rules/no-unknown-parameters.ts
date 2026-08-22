import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

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

function parameterName(parameter: Parameter, sourceText: string): string {
  if (parameter.type === 'TSParameterProperty') {
    return parameterName(parameter.parameter, sourceText);
  }
  if (parameter.type === 'AssignmentPattern') {
    return parameterName(parameter.left, sourceText);
  }
  if (parameter.type === 'RestElement') {
    return parameterName(parameter.argument, sourceText);
  }
  return parameter.type === 'Identifier'
    ? parameter.name
    : sourceText.replace(/\s*:\s*unknown\s*$/u, '');
}

/** Disallow unknown inputs except explicitly named error-cause enrichment. */
export const noUnknownParametersName = bnRuleName('no-unknown-parameters');

export const noUnknownParameters: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow explicitly unknown function parameters except `cause`; decode unknown input at its I/O boundary instead.',
    },
    messages: {
      unknownParameter:
        'Parameter `{{parameter}}` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    defaultOptions: [{ allow: ['cause'] }],
  },
  createOnce(context) {
    const checkParameters = (node: ParameterOwner) => {
      const allow = stringListField(objectOptionAt(context, 0), 'allow', ['cause']);
      for (const parameter of node.params) {
        const annotation = parameterAnnotation(parameter);
        if (annotation?.typeAnnotation.type !== 'TSUnknownKeyword') continue;
        const name = parameterName(parameter, context.sourceCode.getText(parameter));
        if (allow.includes(name)) continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: 'unknownParameter',
          data: { parameter: name },
        });
      }
    };

    return {
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
