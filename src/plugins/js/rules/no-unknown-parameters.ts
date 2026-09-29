import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isDecoderFunction } from '../shared/decoders.ts';
import { isOverloadImplementation } from '../shared/overloads.ts';
import { parameterOwner } from '../shared/parameters.ts';

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

const typeWrapperKinds: ReadonlySet<string> = new Set([
  'TSIntersectionType',
  'TSParenthesizedType',
  'TSUnionType',
]);

const concreteSignatureKinds: ReadonlySet<string> = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression',
]);

function isConcreteSignature(owner: ESTree.Node): boolean {
  return (
    concreteSignatureKinds.has(owner.type) ||
    (owner.type === 'TSMethodSignature' && owner.parent?.type === 'TSInterfaceBody')
  );
}

/**
 * Reports whether a function type is the type of a callback parameter:
 * `decode: (body: unknown) => A`, also inside an inline options type
 * (`options: { decode(body: unknown): A }`). This function calls the callback,
 * so the callback input flows out to the decoder, not in from callers. A nested
 * callback (a callback of a callback) flips the direction again, so it is
 * still checked.
 */
function isCallbackParameterType(node: ParameterOwner): boolean {
  let current: ESTree.Node = node;
  if (node.type === 'TSMethodSignature' || node.type === 'TSCallSignatureDeclaration') {
    if (node.parent?.type !== 'TSTypeLiteral') return false;
    current = node.parent;
  } else if (node.type !== 'TSFunctionType' && node.type !== 'TSConstructorType') {
    return false;
  }
  while (true) {
    const parent: ESTree.Node | null = current.parent;
    if (parent === null) return false;
    if (typeWrapperKinds.has(parent.type)) {
      current = parent;
      continue;
    }
    if (parent.type !== 'TSTypeAnnotation') return false;
    const holder = parent.parent;
    if (holder?.type === 'TSPropertySignature' && holder.parent?.type === 'TSTypeLiteral') {
      current = holder.parent;
      continue;
    }
    if (holder === null) return false;
    const owner = parameterOwner(holder);
    return owner !== null && isConcreteSignature(owner);
  }
}

function isRuntimeFunction(
  node: ParameterOwner,
): node is ESTree.ArrowFunctionExpression | ESTree.Function {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
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
        fix: 'Parse at the I/O boundary (schema/decoder), then pass a named domain type into this function. A small decoder may take `unknown`: one `unknown` parameter, an explicit data return type (`number | undefined`), and no `as`, `!`, or `any` in the body. If this parameter is an error `cause`, name it `cause` or add the name to `{ allow: ["cause", "…"] }` on `bl-js/no-unknown-parameters`.',
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
          allowDecoders: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [{ allow: ['cause'], allowDecoders: true }],
  },
  createOnce(context) {
    let allow: readonly string[] = ['cause'];
    let allowDecoders = true;

    const checkParameters = (node: ParameterOwner) => {
      if (isOverloadImplementation(node) || isCallbackParameterType(node)) return;
      if (
        allowDecoders &&
        isRuntimeFunction(node) &&
        isDecoderFunction(node, context.sourceCode.visitorKeys)
      ) {
        return;
      }
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
      before() {
        const options = objectOptionAt(context, 0);
        allow = stringListField(options, 'allow', ['cause']);
        allowDecoders = booleanField(options, 'allowDecoders', true);
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
