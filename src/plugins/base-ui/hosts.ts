import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsBoolean } from '../../lib/js-kind.ts';
import { asExpression, isFunctionLike, unwrapExpression } from './ast.ts';
import { buildRenderHostCatalog, nameSetHas, type RenderHostCatalog } from './options.ts';

/**
 * `mixed`: one branch mounts a `<button>` and another branch does not. No fixed
 * `nativeButton` value is right for both branches.
 */
export type RenderHostKind = 'button' | 'non-button' | 'mixed' | 'unknown';

export type NativeButtonLiteral = boolean | undefined | 'dynamic';

export const DEFAULT_RENDER_HOST_CATALOG: RenderHostCatalog = buildRenderHostCatalog();

export function getJsxAttrValue(
  opening: ESTree.JSXOpeningElement,
  attributeName: string,
): ESTree.Node | undefined {
  for (const attribute of opening.attributes) {
    if (attribute.type !== 'JSXAttribute') {
      continue;
    }
    if (attribute.name.type !== 'JSXIdentifier') {
      continue;
    }
    if (attribute.name.name !== attributeName) {
      continue;
    }
    const { value } = attribute;
    if (value === null || value === undefined) {
      return undefined;
    }
    if (value.type === 'JSXExpressionContainer') {
      return value.expression.type === 'JSXEmptyExpression' ? undefined : value.expression;
    }
    return value;
  }
  return undefined;
}

export function jsxHasAttr(opening: ESTree.JSXOpeningElement, attributeName: string): boolean {
  for (const attribute of opening.attributes) {
    if (attribute.type !== 'JSXAttribute') {
      continue;
    }
    if (attribute.name.type === 'JSXIdentifier' && attribute.name.name === attributeName) {
      return true;
    }
  }
  return false;
}

export function getJsxName(opening: ESTree.JSXOpeningElement): string | undefined {
  const { name } = opening;
  if (name.type === 'JSXIdentifier') {
    return name.name;
  }
  if (name.type === 'JSXMemberExpression') {
    const parts: string[] = [];
    let current: ESTree.JSXMemberExpression | ESTree.JSXIdentifier = name;
    while (current.type === 'JSXMemberExpression') {
      if (current.property.type !== 'JSXIdentifier') {
        return undefined;
      }
      parts.unshift(current.property.name);
      if (current.object.type === 'JSXIdentifier') {
        current = current.object;
        continue;
      }
      if (current.object.type === 'JSXMemberExpression') {
        current = current.object;
        continue;
      }
      return undefined;
    }
    if (current.type !== 'JSXIdentifier') {
      return undefined;
    }
    parts.unshift(current.name);
    return parts.join('.');
  }
  return undefined;
}

export function getNativeButtonLiteral(opening: ESTree.JSXOpeningElement): NativeButtonLiteral {
  for (const attribute of opening.attributes) {
    if (attribute.type !== 'JSXAttribute') {
      continue;
    }
    if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'nativeButton') {
      continue;
    }
    const { value } = attribute;
    if (value === null || value === undefined) {
      return true;
    }
    if (value.type === 'JSXExpressionContainer' && value.expression.type === 'JSXEmptyExpression') {
      return 'dynamic';
    }
    const expression = unwrapExpression(
      asExpression(value.type === 'JSXExpressionContainer' ? value.expression : value),
    );
    if (expression === undefined) {
      return 'dynamic';
    }
    if (expression.type === 'Literal' && isJsBoolean(expression.value)) {
      return expression.value;
    }
    return 'dynamic';
  }
  return undefined;
}

function jsxElementOpeningName(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(asExpression(node));
  if (expression?.type !== 'JSXElement') {
    return undefined;
  }
  return getJsxName(expression.openingElement);
}

export function classifyJsxHostName(
  name: string | undefined,
  catalog: RenderHostCatalog = DEFAULT_RENDER_HOST_CATALOG,
): RenderHostKind {
  if (name === undefined) {
    return 'unknown';
  }
  if (name === name.toLowerCase()) {
    return name === 'button' ? 'button' : 'non-button';
  }
  if (nameSetHas(catalog.nonButtonNames, name)) {
    return 'non-button';
  }
  if (nameSetHas(catalog.buttonNames, name)) {
    return 'button';
  }
  return 'unknown';
}

function classifyFunctionRender(
  node: ESTree.Function | ESTree.ArrowFunctionExpression,
  catalog: RenderHostCatalog,
): RenderHostKind {
  const { body } = node;
  if (body === null || body === undefined) {
    return 'unknown';
  }
  if (body.type !== 'BlockStatement') {
    return classifyRenderHost(body, catalog);
  }

  let sawButton = false;
  let sawNonButton = false;
  let sawMixed = false;
  let sawUnknown = false;

  const visit = (current: ESTree.Node): void => {
    if (current.type === 'ReturnStatement') {
      const kind = classifyRenderHost(current.argument, catalog);
      if (kind === 'button') {
        sawButton = true;
      } else if (kind === 'non-button') {
        sawNonButton = true;
      } else if (kind === 'mixed') {
        sawMixed = true;
      } else {
        sawUnknown = true;
      }
      return;
    }
    if (current !== body && isFunctionLike(current)) {
      return;
    }
    for (const [key, child] of Object.entries(current)) {
      if (key === 'parent' || key === 'range' || key === 'loc' || key === 'type') {
        continue;
      }
      if (Array.isArray(child)) {
        for (const item of child) {
          if (isAstNode(item)) {
            visit(item);
          }
        }
        continue;
      }
      if (isAstNode(child)) {
        visit(child);
      }
    }
  };

  visit(body);

  if (sawMixed || (sawButton && sawNonButton)) {
    return 'mixed';
  }
  if (sawUnknown) {
    return 'unknown';
  }
  if (sawButton) {
    return 'button';
  }
  if (sawNonButton) {
    return 'non-button';
  }
  return 'unknown';
}

/** `null` or `false` (and `undefined`, checked by the caller): Base UI renders the default element. */
function isEmptyRenderValue(expression: ESTree.Expression): boolean {
  return expression.type === 'Literal' && (expression.value === null || expression.value === false);
}

function combineHostKinds(left: RenderHostKind, right: RenderHostKind): RenderHostKind {
  if (left === right) {
    return left;
  }
  if (left === 'mixed' || right === 'mixed') {
    return 'mixed';
  }
  if (left === 'unknown' || right === 'unknown') {
    return 'unknown';
  }
  return 'mixed';
}

/**
 * Classify the DOM node that a `render` value mounts.
 *
 * `fallback` is the kind of the part's own default element. Base UI renders that
 * element when `render` is falsy, so `render={show && <Link />}` is `<Link>` or
 * the default element.
 * @see https://base-ui.com/react/handbook/composition
 */
export function classifyRenderHost(
  node: ESTree.Node | null | undefined,
  catalog: RenderHostCatalog = DEFAULT_RENDER_HOST_CATALOG,
  fallback: RenderHostKind = 'unknown',
): RenderHostKind {
  if (node?.type === 'Identifier' && node.name === 'undefined') {
    return fallback;
  }
  const expression = unwrapExpression(asExpression(node));
  if (expression === undefined) {
    return 'unknown';
  }

  if (isEmptyRenderValue(expression)) {
    return fallback;
  }

  if (expression.type === 'JSXElement') {
    return classifyJsxHostName(jsxElementOpeningName(expression), catalog);
  }

  if (expression.type === 'JSXFragment') {
    return 'non-button';
  }

  if (isFunctionLike(expression)) {
    return classifyFunctionRender(expression, catalog);
  }

  if (expression.type === 'ConditionalExpression') {
    return combineHostKinds(
      classifyRenderHost(expression.consequent, catalog, fallback),
      classifyRenderHost(expression.alternate, catalog, fallback),
    );
  }

  if (expression.type === 'LogicalExpression') {
    const left =
      expression.operator === '&&' ? fallback : classifyRenderHost(expression.left, catalog);
    return combineHostKinds(left, classifyRenderHost(expression.right, catalog, fallback));
  }

  return 'unknown';
}

export function defaultNativeButton(
  name: string,
  nativeButtonNames: ReadonlySet<string>,
  nonNativeButtonNames: ReadonlySet<string>,
): boolean | undefined {
  if (nameSetHas(nativeButtonNames, name)) {
    return true;
  }
  if (nameSetHas(nonNativeButtonNames, name)) {
    return false;
  }
  return undefined;
}
