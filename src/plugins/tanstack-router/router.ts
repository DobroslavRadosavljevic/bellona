import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import { getCallName, getStaticPropertyName, unwrapExpression } from './ast.ts';

export const TANSTACK_ROUTER_MODULES = [
  '@tanstack/react-router',
  '@tanstack/solid-router',
  '@tanstack/react-start',
  '@tanstack/solid-start',
] as const;

const TANSTACK_ROUTER_MODULE_SET = new Set<string>(TANSTACK_ROUTER_MODULES);

export const ROUTER_NAV_JSX_NAMES = new Set(['Link', 'Navigate']);

export const ROUTER_NAV_CALL_METHODS = new Set([
  'navigate',
  'redirect',
  'linkOptions',
  'buildLocation',
  'preloadRoute',
]);

export const ROUTER_HOOK_NAMES = new Set([
  'useNavigate',
  'useParams',
  'useSearch',
  'useLoaderData',
  'useRouteContext',
]);

export function programImportsTanstackRouter(program: ESTree.Program): boolean {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (isJsString(source) && TANSTACK_ROUTER_MODULE_SET.has(source)) {
      return true;
    }
  }
  return false;
}

export function isStaticRoutePath(node: ESTree.Node | undefined): boolean {
  if (node === undefined || !isExpression(node)) {
    return false;
  }
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (expression.type === 'Literal' && isJsString(expression.value)) {
    return true;
  }
  return expression.type === 'TemplateLiteral' && expression.expressions.length === 0;
}

export function isDynamicRoutePath(node: ESTree.Node | undefined): boolean {
  if (node === undefined) {
    return false;
  }
  return !isStaticRoutePath(node);
}

export function getStaticRoutePathValue(node: ESTree.Node | undefined): string | undefined {
  if (node === undefined || !isExpression(node)) {
    return undefined;
  }
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return undefined;
  }
  if (expression.type === 'Literal' && isJsString(expression.value)) {
    return expression.value;
  }
  if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis.map((quasi) => quasi.value.cooked ?? '').join('');
  }
  return undefined;
}

export function isRelativeRoutePath(value: string): boolean {
  return value === '.' || value === '..' || !value.startsWith('/');
}

export function isExternalHref(value: string): boolean {
  return /^(?:https?:|mailto:|tel:|\/\/)/iu.test(value);
}

export function isTypeAssertionNode(node: ESTree.Node): boolean {
  return (
    node.type === 'TSAsExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression'
  );
}

export function hasTypeAssertionWrapper(node: ESTree.Node | undefined): boolean {
  let current: ESTree.Node | undefined = node;
  while (current !== undefined && isAssertionOrTransparentWrapper(current)) {
    if (isTypeAssertionNode(current)) {
      return true;
    }
    current = wrapperInnerNode(current);
  }
  return false;
}

function wrapperInnerNode(node: ESTree.Node): ESTree.Node | undefined {
  switch (node.type) {
    case 'TSAsExpression':
    case 'TSTypeAssertion':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
    case 'TSInstantiationExpression':
    case 'ParenthesizedExpression':
    case 'ChainExpression':
      return node.expression;
    default:
      return undefined;
  }
}

function isAssertionOrTransparentWrapper(node: ESTree.Node): boolean {
  return (
    node.type === 'TSAsExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'ChainExpression' ||
    node.type === 'TSInstantiationExpression' ||
    node.type === 'ParenthesizedExpression'
  );
}

function isExpression(node: ESTree.Node): node is ESTree.Expression {
  return 'type' in node;
}

export function getObjectPropValue(
  node: ESTree.Node | undefined,
  propertyName: string,
): ESTree.Expression | undefined {
  if (node === undefined || !isExpression(node)) {
    return undefined;
  }
  const expression = unwrapExpression(node);
  if (expression?.type !== 'ObjectExpression') {
    return undefined;
  }
  for (const property of expression.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }
    if (getStaticPropertyName(property.key) === propertyName) {
      return property.value;
    }
  }
  return undefined;
}

export function objectHasOwnProperty(node: ESTree.Node | undefined, propertyName: string): boolean {
  return getObjectPropValue(node, propertyName) !== undefined;
}

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

function callLeafName(node: ESTree.CallExpression): string | undefined {
  const callName = getCallName(node);
  return callName?.split('.').at(-1);
}

export function isRouterNavCall(node: ESTree.CallExpression): boolean {
  const leaf = callLeafName(node);
  return leaf !== undefined && ROUTER_NAV_CALL_METHODS.has(leaf);
}

export function isBareRouterHookCall(node: ESTree.CallExpression): boolean {
  const callee = unwrapExpression(node.callee);
  return callee?.type === 'Identifier' && ROUTER_HOOK_NAMES.has(callee.name);
}

export function isRouterHookCall(node: ESTree.CallExpression): boolean {
  const leaf = callLeafName(node);
  return leaf !== undefined && ROUTER_HOOK_NAMES.has(leaf);
}

export function hasFromOrStrictFalse(optionsObject: ESTree.Node | undefined): boolean {
  if (objectHasOwnProperty(optionsObject, 'from')) {
    return true;
  }
  const strictValue = getObjectPropValue(optionsObject, 'strict');
  if (strictValue === undefined) {
    return false;
  }
  const unwrapped = unwrapExpression(strictValue);
  return unwrapped?.type === 'Literal' && unwrapped.value === false;
}

export function resolveIdentifierInit(
  node: ESTree.Node | undefined,
): ESTree.Expression | undefined {
  if (node === undefined || !isExpression(node)) {
    return undefined;
  }
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return undefined;
  }
  if (expression.type !== 'Identifier') {
    return expression;
  }

  const { name } = expression;
  let current: ESTree.Node | undefined = expression.parent;

  while (current !== undefined) {
    if (current.type === 'BlockStatement' || current.type === 'Program') {
      const body = current.body;
      for (const statement of body) {
        if (statement.type !== 'VariableDeclaration') {
          continue;
        }
        for (const declarator of statement.declarations) {
          if (
            declarator.id.type === 'Identifier' &&
            declarator.id.name === name &&
            declarator.init !== null &&
            declarator.init !== undefined
          ) {
            return declarator.init;
          }
        }
      }
      if (current.type === 'Program') {
        return undefined;
      }
    }

    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      for (const param of current.params) {
        if (param.type === 'Identifier' && param.name === name) {
          return undefined;
        }
      }
    }

    current = current.parent;
  }

  return undefined;
}

export function navigateBindingHasFrom(callee: ESTree.Expression | undefined): boolean {
  const init = resolveIdentifierInit(callee);
  if (init === undefined) {
    return false;
  }
  const call = unwrapExpression(init);
  if (call?.type !== 'CallExpression') {
    return false;
  }
  const callCallee = unwrapExpression(call.callee);
  if (
    callCallee?.type === 'MemberExpression' &&
    getStaticPropertyName(callCallee.property) === 'useNavigate'
  ) {
    return true;
  }
  if (callCallee?.type === 'Identifier' && callCallee.name === 'useNavigate') {
    const options = call.arguments[0];
    if (options === undefined || options.type === 'SpreadElement') {
      return false;
    }
    return objectHasOwnProperty(options, 'from');
  }
  return false;
}

export function getJsxComponentName(opening: ESTree.JSXOpeningElement): string | undefined {
  const { name } = opening;
  if (name.type === 'JSXIdentifier') {
    return name.name;
  }
  return undefined;
}

export function isRouterNavJsx(opening: ESTree.JSXOpeningElement): boolean {
  const name = getJsxComponentName(opening);
  return name !== undefined && ROUTER_NAV_JSX_NAMES.has(name);
}

export function getNavOptionObjects(argument: ESTree.Node | undefined): ESTree.ObjectExpression[] {
  if (argument === undefined || !isExpression(argument)) {
    return [];
  }
  const expression = unwrapExpression(argument);
  if (expression === undefined) {
    return [];
  }
  if (expression.type === 'ObjectExpression') {
    return [expression];
  }
  if (expression.type === 'ArrayExpression') {
    const objects: ESTree.ObjectExpression[] = [];
    for (const element of expression.elements) {
      if (element === null || element.type === 'SpreadElement' || !isExpression(element)) {
        continue;
      }
      const unwrapped = unwrapExpression(element);
      if (unwrapped?.type === 'ObjectExpression') {
        objects.push(unwrapped);
      }
    }
    return objects;
  }
  return [];
}

export function getCallTypeArguments(
  node: ESTree.CallExpression,
): readonly ESTree.TSType[] | undefined {
  const params = node.typeArguments?.params;
  return params !== undefined && params.length > 0 ? params : undefined;
}
