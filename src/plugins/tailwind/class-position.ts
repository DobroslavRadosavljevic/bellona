import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../lib/js-kind.ts';
import { getCallName, isAllowedCallee, unwrapExpression } from './ast.ts';

/** Class helpers whose arguments are class strings. `tv` / `cva` take a config object. */
export const DEFAULT_CLASS_CALLEES = [
  'cn',
  'clsx',
  'cx',
  'classnames',
  'classNames',
  'twMerge',
  'twJoin',
  'cnMerge',
  'tv',
  'cva',
] as const;

/** JSX attributes that take class strings. Names that end in `ClassName` also match. */
export const DEFAULT_CLASS_ATTRIBUTES = ['className', 'class'] as const;

export const CLASS_POSITION_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    attributes: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    callees: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
  },
} as const;

export const DEFAULT_CLASS_POSITION_OPTIONS = [
  {
    allow: [],
    attributes: [...DEFAULT_CLASS_ATTRIBUTES],
    callees: [...DEFAULT_CLASS_CALLEES],
  },
];

export interface ClassPositionVisitor {
  /** A string literal (also an object key) in a class position. */
  string(node: ESTree.Node, text: string): void;
  /** A template literal in a class position. Its expressions are also walked. */
  template(node: ESTree.TemplateLiteral): void;
}

export function isClassAttributeName(name: string, attributes: readonly string[]): boolean {
  return attributes.includes(name) || name.endsWith('ClassName');
}

export function isClassCallee(node: ESTree.CallExpression, callees: readonly string[]): boolean {
  return isAllowedCallee(getCallName(node), callees);
}

/**
 * Walk the values that can end up in a class string. A nested class helper call
 * (`cn(...)` inside `className`) stops the walk: the `CallExpression` visitor
 * reads it, so each string is read one time.
 */
export function walkClassValue(
  node: ESTree.Node | null | undefined,
  visitor: ClassPositionVisitor,
): void {
  const current = unwrapExpression(node);
  if (current === undefined) {
    return;
  }
  switch (current.type) {
    case 'Literal': {
      if (isJsString(current.value)) {
        visitor.string(current, current.value);
      }
      return;
    }
    case 'TemplateLiteral': {
      visitor.template(current);
      for (const expression of current.expressions) {
        walkClassValue(expression, visitor);
      }
      return;
    }
    case 'ConditionalExpression': {
      walkClassValue(current.consequent, visitor);
      walkClassValue(current.alternate, visitor);
      return;
    }
    case 'LogicalExpression':
    case 'BinaryExpression': {
      walkClassValue(current.left, visitor);
      walkClassValue(current.right, visitor);
      return;
    }
    case 'ArrayExpression': {
      for (const element of current.elements) {
        walkClassValue(element, visitor);
      }
      return;
    }
    case 'ObjectExpression': {
      for (const property of current.properties) {
        if (property.type === 'SpreadElement') {
          walkClassValue(property.argument, visitor);
          continue;
        }
        if (!property.computed && property.key.type === 'Literal') {
          walkClassValue(property.key, visitor);
        }
        walkClassValue(property.value, visitor);
      }
      return;
    }
    case 'SpreadElement': {
      walkClassValue(current.argument, visitor);
      return;
    }
    default:
      return;
  }
}

/** Walk the value of a class attribute such as `className="…"` or `className={cn(…)}`. */
export function walkClassAttribute(
  attribute: ESTree.JSXAttribute,
  attributes: readonly string[],
  visitor: ClassPositionVisitor,
): void {
  if (attribute.name.type !== 'JSXIdentifier') {
    return;
  }
  if (!isClassAttributeName(attribute.name.name, attributes)) {
    return;
  }
  const { value } = attribute;
  if (value === null || value === undefined) {
    return;
  }
  if (value.type === 'Literal') {
    walkClassValue(value, visitor);
    return;
  }
  if (value.type === 'JSXExpressionContainer' && value.expression.type !== 'JSXEmptyExpression') {
    walkClassValue(value.expression, visitor);
  }
}

/** Walk the arguments of a class helper call such as `cn(…)` or `tv({ … })`. */
export function walkClassCall(
  call: ESTree.CallExpression,
  callees: readonly string[],
  visitor: ClassPositionVisitor,
): void {
  if (!isClassCallee(call, callees)) {
    return;
  }
  for (const argument of call.arguments) {
    walkClassValue(argument, visitor);
  }
}
