import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsBoolean } from '../../lib/js-kind.ts';
import { asExpression, isFunctionLike, unwrapExpression } from './ast.ts';
import { buildRenderHostCatalog, nameSetHas, type RenderHostCatalog } from './options.ts';

export type RenderHostKind = 'button' | 'non-button' | 'unknown';

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
  let sawUnknown = false;

  const visit = (current: ESTree.Node): void => {
    if (current.type === 'ReturnStatement') {
      const kind = classifyRenderHost(current.argument, catalog);
      if (kind === 'button') {
        sawButton = true;
      } else if (kind === 'non-button') {
        sawNonButton = true;
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

  if (sawNonButton) {
    return 'non-button';
  }
  if (sawButton && !sawUnknown) {
    return 'button';
  }
  return 'unknown';
}

function combineHostKinds(left: RenderHostKind, right: RenderHostKind): RenderHostKind {
  if (left === 'non-button' || right === 'non-button') {
    return 'non-button';
  }
  if (left === 'button' && right === 'button') {
    return 'button';
  }
  return 'unknown';
}

export function classifyRenderHost(
  node: ESTree.Node | null | undefined,
  catalog: RenderHostCatalog = DEFAULT_RENDER_HOST_CATALOG,
): RenderHostKind {
  const expression = unwrapExpression(asExpression(node));
  if (expression === undefined) {
    return 'unknown';
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
      classifyRenderHost(expression.consequent, catalog),
      classifyRenderHost(expression.alternate, catalog),
    );
  }

  if (expression.type === 'LogicalExpression') {
    return combineHostKinds(
      classifyRenderHost(expression.left, catalog),
      classifyRenderHost(expression.right, catalog),
    );
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
