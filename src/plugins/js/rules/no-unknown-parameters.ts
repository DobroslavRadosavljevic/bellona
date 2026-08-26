import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
      unknownParameter: agentDiagnostic({
        problem:
          'Parameter `{{parameter}}` is typed as `unknown`. The default allowlist is `cause` for error enrichment. This name is not on that list (or `{ allow }` does not include it).',
        why: '`unknown` means “not parsed yet”. If this function accepts it, every caller can dump raw I/O inward and the parse never happens.',
        fix: 'Parse at the I/O boundary (schema/decoder), then pass a named domain type into this function. If this parameter is an error `cause`, name it `cause` or add the name to `{ allow: ["cause", "…"] }` on `bl-js/no-unknown-parameters`.',
        avoid:
          'Do not replace `unknown` with `any`, `object`, or `Record<string, unknown>`. Do not assert `as T` inside the function. Do not disable the rule.',
      }),
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
