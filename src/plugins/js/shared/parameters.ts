import type { ESTree } from '@oxlint/plugins';

function isParameterOf(owner: ESTree.Node, parameter: ESTree.Node): boolean {
  if (!('params' in owner)) return false;
  const parameters: readonly ESTree.Node[] = owner.params;
  return parameters.some((entry) => entry === parameter);
}

/**
 * The function or signature that declares `binding` as a parameter. The
 * binding can sit under a default (`x: T = v`), a rest element, or a
 * constructor parameter property.
 */
export function parameterOwner(binding: ESTree.Node): ESTree.Node | null {
  let parameter = binding;
  const parent = binding.parent;
  if (
    parent?.type === 'AssignmentPattern' ||
    parent?.type === 'RestElement' ||
    parent?.type === 'TSParameterProperty'
  ) {
    parameter = parent;
  }
  const owner = parameter.parent;
  return owner !== null && isParameterOf(owner, parameter) ? owner : null;
}
