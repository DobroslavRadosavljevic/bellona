import type { ESTree } from '@oxlint/plugins';

import { getCallArgument, unwrapExpression } from './ast.ts';
import { isModuleCall, type EffectBindings } from './bindings.ts';

/**
 * The fields object of an error class factory call:
 * `Schema.TaggedError<X>()("X", fields)` and `Schema.Error<X>("X")(fields)`.
 * A `Schema.Struct(fields)` argument gives its own fields.
 */
export function schemaErrorFields(
  node: ESTree.CallExpression,
  bindings: EffectBindings,
): ESTree.ObjectExpression | undefined {
  const factory = unwrapExpression(node.callee);
  if (factory?.type !== 'CallExpression') {
    return undefined;
  }
  let fields: ESTree.Node | undefined;
  if (isModuleCall(factory, bindings, 'schema', 'TaggedError')) {
    fields = getCallArgument(node, 1);
  } else if (isModuleCall(factory, bindings, 'schema', 'Error')) {
    fields = getCallArgument(node, 0);
  }
  if (fields?.type === 'CallExpression' && isModuleCall(fields, bindings, 'schema', 'Struct')) {
    fields = getCallArgument(fields, 0);
  }
  return fields?.type === 'ObjectExpression' ? fields : undefined;
}
