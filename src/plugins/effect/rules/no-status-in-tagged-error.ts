import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsNumber } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, getStaticPropertyName, pipeRoot, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { schemaErrorFields } from '../error-classes.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noStatusInTaggedErrorName = bnRuleName('no-status-in-tagged-error');

const STATUS_KEYS = new Set(['status', 'statusCode', 'httpStatus']);

function isNumberLiteral(node: ESTree.Node | undefined): boolean {
  const expression = unwrapExpression(node);
  return expression?.type === 'Literal' && isJsNumber(expression.value);
}

/**
 * True for a fixed status value: `404`, `Schema.Literal(404)`, or a `.pipe(…)` chain on
 * one. `Schema.Number` records a status that an upstream API sent, so it is data.
 */
function isFixedStatus(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  if (isNumberLiteral(node)) {
    return true;
  }
  const root = pipeRoot(node);
  return (
    root?.type === 'CallExpression' &&
    (isModuleCall(root, bindings, 'schema', 'Literal') ||
      isModuleCall(root, bindings, 'schema', 'tag')) &&
    isNumberLiteral(getCallArgument(root, 0))
  );
}

/** True for a `Schema.TaggedError` / `Schema.Error` / `Data.TaggedError` / `Data.Error` class super. */
function isErrorClassSuper(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    if (
      isModuleCall(current, bindings, 'schema', 'TaggedError') ||
      isModuleCall(current, bindings, 'schema', 'Error')
    ) {
      return true;
    }
    current = unwrapExpression(current.callee);
  }
  return isDataErrorSuper(node, bindings);
}

/** True for `Data.TaggedError("X")` or `Data.Error` as a class super expression. */
function isDataErrorSuper(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type === 'CallExpression') {
    return isModuleCall(expression, bindings, 'data', 'TaggedError');
  }
  return isModuleMember(expression, bindings, 'data', 'Error');
}

export const noStatusInTaggedError: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a fixed HTTP status (status, statusCode, httpStatus) on Effect tagged error classes',
    },
    messages: {
      status: agentDiagnostic({
        problem:
          'This tagged error sets a fixed `{{key}}`. A domain error should not choose its HTTP status.',
        why: 'The `_tag` already names the failure. The HTTP status belongs to the route, so each transport can map tags to its own status and the domain stays free of HTTP.',
        fix: 'Remove `{{key}}`. Map the error tag to a fixed status at the route or the error handler (for example with `Effect.catchTag`). A field that records the status an upstream API sent (`Schema.Number`) is data and is allowed.',
        avoid: 'Do not rename the field to `code` or `httpCode`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        const fields = schemaErrorFields(node, bindings);
        if (fields === undefined) {
          return;
        }
        for (const property of fields.properties) {
          if (property.type !== 'Property') {
            continue;
          }
          const key = getStaticPropertyName(property.key);
          if (
            key !== undefined &&
            STATUS_KEYS.has(key) &&
            isFixedStatus(property.value, bindings)
          ) {
            context.report({ messageId: 'status', node: property.key, data: { key } });
          }
        }
      },
      ClassDeclaration(node) {
        reportClass(node);
      },
      ClassExpression(node) {
        reportClass(node);
      },
    };

    function reportClass(node: ESTree.Class): void {
      const superClass = node.superClass ?? undefined;
      if (!isErrorClassSuper(superClass, bindings)) {
        return;
      }
      for (const element of node.body.body) {
        if (element.type !== 'PropertyDefinition') {
          continue;
        }
        const key = getStaticPropertyName(element.key);
        if (
          key !== undefined &&
          STATUS_KEYS.has(key) &&
          isNumberLiteral(element.value ?? undefined)
        ) {
          context.report({ messageId: 'status', node: element.key, data: { key } });
        }
      }
      const fieldTypes = isDataErrorSuper(superClass, bindings)
        ? node.superTypeArguments?.params[0]
        : undefined;
      if (fieldTypes?.type !== 'TSTypeLiteral') {
        return;
      }
      for (const member of fieldTypes.members) {
        if (member.type !== 'TSPropertySignature') {
          continue;
        }
        const key = getStaticPropertyName(member.key);
        const type = member.typeAnnotation?.typeAnnotation;
        if (
          key !== undefined &&
          STATUS_KEYS.has(key) &&
          type?.type === 'TSLiteralType' &&
          type.literal.type === 'Literal' &&
          isJsNumber(type.literal.value)
        ) {
          context.report({ messageId: 'status', node: member.key, data: { key } });
        }
      }
    }
  },
});
