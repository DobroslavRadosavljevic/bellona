import type { ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../lib/ast-node.ts';
import { isJsBoolean } from '../../lib/js-kind.ts';
import { asExpression, isFunctionLike, unwrapExpression } from './ast.ts';

export const NATIVE_BUTTON_DEFAULT_COMPONENTS = [
  'Button',
  'DialogTrigger',
  'DialogClose',
  'AlertDialogTrigger',
  'AlertDialogCancel',
  'AlertDialogAction',
  'SheetTrigger',
  'SheetClose',
  'PopoverTrigger',
  'PopoverClose',
  'DropdownMenuTrigger',
  'DropdownMenuSubTrigger',
  'ContextMenuTrigger',
  'ContextMenuSubTrigger',
  'MenubarTrigger',
  'MenubarSubTrigger',
  'TabsTab',
  'AccordionTrigger',
  'CollapsibleTrigger',
  'SelectTrigger',
  'ComboboxTrigger',
  'AutocompleteTrigger',
  'ToolbarButton',
  'Toggle',
] as const;

export const BUTTON_RENDER_HOST_COMPONENTS = ['Button', 'SidebarMenuButton'] as const;

export const NON_BUTTON_RENDER_HOST_COMPONENTS = ['Link', 'ButtonAnchor', 'NavLink'] as const;

export type RenderHostKind = 'button' | 'non-button' | 'unknown';

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

export function getNativeButtonLiteral(
  opening: ESTree.JSXOpeningElement,
): boolean | undefined | 'dynamic' {
  if (!jsxHasAttr(opening, 'nativeButton')) {
    return undefined;
  }
  const value = getJsxAttrValue(opening, 'nativeButton');
  if (value === undefined) {
    return true;
  }
  const expression = unwrapExpression(asExpression(value));
  if (expression === undefined) {
    return 'dynamic';
  }
  if (expression.type === 'Literal' && isJsBoolean(expression.value)) {
    return expression.value;
  }
  return 'dynamic';
}

function jsxElementOpeningName(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(asExpression(node));
  if (expression?.type !== 'JSXElement') {
    return undefined;
  }
  return getJsxName(expression.openingElement);
}

function leafName(name: string): string {
  return name.split('.').at(-1) ?? name;
}

const BUTTON_HOSTS = new Set<string>(BUTTON_RENDER_HOST_COMPONENTS);
const NON_BUTTON_HOSTS = new Set<string>(NON_BUTTON_RENDER_HOST_COMPONENTS);

export function classifyJsxHostName(name: string | undefined): RenderHostKind {
  if (name === undefined) {
    return 'unknown';
  }
  if (name === name.toLowerCase()) {
    return name === 'button' ? 'button' : 'non-button';
  }
  const leaf = leafName(name);
  if (BUTTON_HOSTS.has(name) || BUTTON_HOSTS.has(leaf)) {
    return 'button';
  }
  if (NON_BUTTON_HOSTS.has(name) || NON_BUTTON_HOSTS.has(leaf)) {
    return 'non-button';
  }
  return 'unknown';
}

function classifyFunctionRender(
  node: ESTree.Function | ESTree.ArrowFunctionExpression,
): RenderHostKind {
  const { body } = node;
  if (body === null || body === undefined) {
    return 'unknown';
  }
  if (body.type !== 'BlockStatement') {
    return classifyRenderHost(body);
  }

  let sawButton = false;
  let sawNonButton = false;
  let sawUnknown = false;

  const visit = (current: ESTree.Node): void => {
    if (current.type === 'ReturnStatement') {
      const kind = classifyRenderHost(current.argument);
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

export function classifyRenderHost(node: ESTree.Node | null | undefined): RenderHostKind {
  const expression = unwrapExpression(asExpression(node));
  if (expression === undefined) {
    return 'unknown';
  }

  if (expression.type === 'JSXElement') {
    return classifyJsxHostName(jsxElementOpeningName(expression));
  }

  if (expression.type === 'JSXFragment') {
    return 'non-button';
  }

  if (isFunctionLike(expression)) {
    return classifyFunctionRender(expression);
  }

  if (expression.type === 'ConditionalExpression') {
    const consequent = classifyRenderHost(expression.consequent);
    const alternate = classifyRenderHost(expression.alternate);
    if (consequent === 'non-button' || alternate === 'non-button') {
      return 'non-button';
    }
    if (consequent === 'button' && alternate === 'button') {
      return 'button';
    }
    return 'unknown';
  }

  if (expression.type === 'LogicalExpression') {
    const left = classifyRenderHost(expression.left);
    const right = classifyRenderHost(expression.right);
    if (left === 'non-button' || right === 'non-button') {
      return 'non-button';
    }
    if (left === 'button' && right === 'button') {
      return 'button';
    }
    return 'unknown';
  }

  return 'unknown';
}
