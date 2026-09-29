import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { schemaErrorFields } from '../error-classes.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireDefectCauseName = bnRuleName('require-defect-cause');

/** Wrappers that keep the inner schema: `Schema.optional(Schema.Unknown)`. */
const WRAPPERS = ['optional', 'optionalKey', 'NullOr', 'UndefinedOr', 'NullishOr'] as const;

/** The name when the schema is `Schema.Unknown` / `Schema.Any`, also inside a wrapper. */
function untypedSchema(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
): string | undefined {
  const expression = unwrapExpression(node);
  for (const name of ['Unknown', 'Any']) {
    if (isModuleMember(expression, bindings, 'schema', name)) {
      return name;
    }
  }
  if (
    expression?.type === 'CallExpression' &&
    WRAPPERS.some((wrapper) => isModuleCall(expression, bindings, 'schema', wrapper))
  ) {
    return untypedSchema(getCallArgument(expression, 0), bindings);
  }
  return undefined;
}

export const requireDefectCause: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require Schema.Defect() instead of Schema.Unknown / Schema.Any for the cause field of a schema error',
    },
    messages: {
      defect: agentDiagnostic({
        problem: 'The `cause` field of this error uses `Schema.{{name}}`. Use `Schema.Defect()`.',
        why: '`Schema.{{name}}` keeps the value as it is. An `Error` then becomes `{}` in JSON, so logs, RPC, and HTTP lose its message. `Schema.Defect()` encodes an `Error` as `{ name, message }` and decodes it back to an `Error`.',
        fix: 'Write `cause: Schema.Defect()`. Keep the wrapper if the field is optional: `cause: Schema.optional(Schema.Defect())`.',
        avoid:
          'Do not store `String(cause)` in a `Schema.String` field instead. Do not disable the rule.',
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
          if (property.type !== 'Property' || getStaticPropertyName(property.key) !== 'cause') {
            continue;
          }
          const name = untypedSchema(property.value, bindings);
          if (name !== undefined) {
            context.report({ messageId: 'defect', node: property.value, data: { name } });
          }
        }
      },
    };
  },
});
