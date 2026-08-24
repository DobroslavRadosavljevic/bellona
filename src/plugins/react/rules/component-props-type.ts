import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  isComponentWrapperCall,
  isModuleLevelDeclaration,
  unwrapComponentInit,
  unwrapExpression,
} from '../ast.ts';
import { isPrimaryComponentName } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipTsxFile } from '../options.ts';

export const componentPropsTypeName = bnRuleName('component-props-type');

const COMPONENT_TYPE_WRAPPERS = new Set([
  'FC',
  'FunctionComponent',
  'ComponentType',
  'VoidFunctionComponent',
  'VFC',
]);

type TypeDeclaration = {
  node: ESTree.Node;
  empty: boolean;
};

function moduleDeclaration(statement: ESTree.Node): ESTree.Node | null | undefined {
  if (
    statement.type === 'ExportNamedDeclaration' ||
    statement.type === 'ExportDefaultDeclaration'
  ) {
    return statement.declaration;
  }
  return statement;
}

function unwrapType(type: ESTree.TSType): ESTree.TSType {
  let current = type;
  while (current.type === 'TSParenthesizedType') {
    current = current.typeAnnotation;
  }
  return current;
}

function typeReferenceName(type: ESTree.TSType): string | undefined {
  const unwrapped = unwrapType(type);
  if (unwrapped.type !== 'TSTypeReference' || unwrapped.typeName.type !== 'Identifier') {
    return undefined;
  }
  return unwrapped.typeName.name;
}

function firstTypeArgument(type: ESTree.TSType): ESTree.TSType | undefined {
  const unwrapped = unwrapType(type);
  if (unwrapped.type !== 'TSTypeReference') {
    return undefined;
  }
  return unwrapped.typeArguments?.params[0];
}

function propsTypeNameFromAnnotation(type: ESTree.TSType | null | undefined): string | undefined {
  if (type === undefined || type === null) {
    return undefined;
  }
  const name = typeReferenceName(type);
  if (name === undefined) {
    return undefined;
  }
  if (COMPONENT_TYPE_WRAPPERS.has(name)) {
    const inner = firstTypeArgument(type);
    return inner === undefined ? undefined : typeReferenceName(inner);
  }
  return name;
}

function parameterAnnotation(
  parameter: ESTree.ParamPattern,
): ESTree.TSTypeAnnotation | null | undefined {
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

function propsTypeNameFromFunction(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): string | undefined {
  const [first] = fn.params;
  if (first === undefined) {
    return undefined;
  }
  return propsTypeNameFromAnnotation(parameterAnnotation(first)?.typeAnnotation);
}

function propsTypeNameFromWrapper(call: ESTree.CallExpression): string | undefined {
  const second = call.typeArguments?.params[1];
  return second === undefined ? undefined : typeReferenceName(second);
}

function propsTypeNameFromInit(init: ESTree.Expression | undefined): string | undefined {
  let current = unwrapExpression(init);
  while (current?.type === 'CallExpression' && isComponentWrapperCall(current)) {
    const fromArgs = propsTypeNameFromWrapper(current);
    if (fromArgs !== undefined) {
      return fromArgs;
    }
    const nextArgument = current.arguments.find((argument) => argument.type !== 'SpreadElement');
    current = nextArgument === undefined ? undefined : unwrapExpression(nextArgument);
  }
  return undefined;
}

function isEmptyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapType(type);
  return unwrapped.type === 'TSTypeLiteral' && unwrapped.members.length === 0;
}

function isEmptyInterface(node: ESTree.TSInterfaceDeclaration): boolean {
  return node.extends.length === 0 && node.body.body.length === 0;
}

function expectedPropsName(componentName: string): string {
  return `${componentName}Props`;
}

export const componentPropsType: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require each primary component to use a non-empty same-file `{Name}Props` type',
    },
    messages: {
      missing: 'Primary component `{{name}}` must take props typed as `{{expected}}`.',
      wrongName: 'Primary component `{{name}}` must use the props type `{{expected}}`.',
      missingLocal: 'Declare `{{expected}}` in this file. Do not import the component props type.',
      empty: 'Props type `{{expected}}` must declare at least one member.',
      extraType: 'A component file may declare only the component and its `*Props` type.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const typeDeclarations = new Map<string, TypeDeclaration>();
    const primaryNames = new Set<string>();

    const recordType = (name: string, node: ESTree.Node, empty: boolean) => {
      const existing = typeDeclarations.get(name);
      if (existing === undefined) {
        typeDeclarations.set(name, { node, empty });
        return;
      }
      typeDeclarations.set(name, { node: existing.node, empty: existing.empty && empty });
    };

    const checkComponent = (
      reportNode: ESTree.Node,
      name: string | undefined,
      fn: ESTree.Function | ESTree.ArrowFunctionExpression,
      init: ESTree.Expression | undefined,
      variableAnnotation: ESTree.TSType | undefined,
    ) => {
      if (name === undefined || !isPrimaryComponentName(name)) {
        return;
      }
      primaryNames.add(name);
      const expected = expectedPropsName(name);
      const used =
        propsTypeNameFromAnnotation(variableAnnotation) ??
        propsTypeNameFromFunction(fn) ??
        propsTypeNameFromInit(init);

      if (used === undefined) {
        context.report({ messageId: 'missing', node: reportNode, data: { name, expected } });
        return;
      }
      if (used !== expected) {
        context.report({ messageId: 'wrongName', node: reportNode, data: { name, expected } });
        return;
      }

      const declaration = typeDeclarations.get(expected);
      if (declaration === undefined) {
        context.report({
          messageId: 'missingLocal',
          node: reportNode,
          data: { expected },
        });
        return;
      }
      if (declaration.empty) {
        context.report({
          messageId: 'empty',
          node: declaration.node,
          data: { expected },
        });
      }
    };

    return {
      before() {
        typeDeclarations.clear();
        primaryNames.clear();
        if (shouldSkipTsxFile(context)) {
          return false;
        }
      },
      Program(node) {
        for (const statement of node.body) {
          const declaration = moduleDeclaration(statement);
          if (declaration?.type === 'TSTypeAliasDeclaration') {
            recordType(
              declaration.id.name,
              declaration.id,
              isEmptyType(declaration.typeAnnotation),
            );
          }
          if (declaration?.type === 'TSInterfaceDeclaration') {
            recordType(declaration.id.name, declaration.id, isEmptyInterface(declaration));
          }
        }
      },
      FunctionDeclaration(node) {
        if (!isModuleLevelDeclaration(node)) {
          return;
        }
        checkComponent(node.id ?? node, node.id?.name, node, undefined, undefined);
      },
      VariableDeclarator(node) {
        const fn = unwrapComponentInit(node.init);
        if (fn === undefined || !isModuleLevelDeclaration(node) || node.id.type !== 'Identifier') {
          return;
        }
        checkComponent(
          node.id,
          node.id.name,
          fn,
          unwrapExpression(node.init),
          node.id.typeAnnotation?.typeAnnotation,
        );
      },
      after() {
        if (primaryNames.size === 0) {
          return;
        }
        const allowed = new Set<string>();
        for (const name of primaryNames) {
          allowed.add(expectedPropsName(name));
        }
        for (const [typeName, declaration] of typeDeclarations) {
          if (allowed.has(typeName)) {
            continue;
          }
          context.report({ messageId: 'extraType', node: declaration.node });
        }
      },
    };
  },
});
