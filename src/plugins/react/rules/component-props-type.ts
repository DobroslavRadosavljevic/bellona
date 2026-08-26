import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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

function hasWrapperPropsTypeArgument(init: ESTree.Expression | undefined): boolean {
  let current = unwrapExpression(init);
  while (current?.type === 'CallExpression' && isComponentWrapperCall(current)) {
    if (current.typeArguments?.params[1] !== undefined) {
      return true;
    }
    const nextArgument = current.arguments.find((argument) => argument.type !== 'SpreadElement');
    current = nextArgument === undefined ? undefined : unwrapExpression(nextArgument);
  }
  return false;
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

function hasPropsTypeAttempt(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
  init: ESTree.Expression | undefined,
  variableAnnotation: ESTree.TSType | undefined,
): boolean {
  if (variableAnnotation !== undefined) {
    return true;
  }
  const [first] = fn.params;
  const annotation = first === undefined ? undefined : parameterAnnotation(first);
  if (annotation !== undefined && annotation !== null) {
    return true;
  }
  return hasWrapperPropsTypeArgument(init);
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
      description:
        'When a primary component types its props, require a non-empty same-file `{Name}Props` type',
    },
    messages: {
      missing: agentDiagnostic({
        problem:
          'Primary component `{{name}}` types its props, but the type is not `{{expected}}` (`{Component}Props` in the same file).',
        why: 'When a component has a props type, that type must be named after the component and live next to it so the contract is local and searchable.',
        fix: 'Declare `type {{expected}} = { … }` in this file with at least one member. Give `{{name}}` a parameter typed `{{expected}}` (or a single props object of that type). If the component has no props, omit the parameter and any props type.',
        avoid:
          'Do not import `{{expected}}` from another file. Do not use an inline object type on the parameter. Do not use `{}` or an empty interface. Do not disable the rule.',
      }),
      wrongName: agentDiagnostic({
        problem: 'Primary component `{{name}}` uses a props type that is not named `{{expected}}`.',
        why: 'A different props name breaks the `{Component}Props` convention. Search and refactors then miss the contract.',
        fix: 'Rename the props type to `{{expected}}` in this file and use that name on the component parameter.',
        avoid:
          'Do not keep two props types. Do not import a renamed alias. Do not disable the rule.',
      }),
      missingLocal: agentDiagnostic({
        problem:
          '`{{expected}}` is not declared in this file. The component props type must be local, not imported.',
        why: 'An imported props type splits the component from its contract and often becomes a shared bag of fields.',
        fix: 'Declare `type {{expected}} = { … }` in this same file (non-empty). Point the component parameter at that type. Remove the imported props type if it is unused.',
        avoid:
          'Do not re-export the imported type under the expected name. Do not disable the rule.',
      }),
      empty: agentDiagnostic({
        problem: 'Props type `{{expected}}` is empty (`{}` or an interface with no members).',
        why: 'An empty props type is not a contract. Either the component needs no props (then it should not claim a props type with no fields) or fields are missing.',
        fix: 'Add the real props fields to `{{expected}}`. If the component has no props, remove the empty type and the props parameter.',
        avoid: 'Do not add a dummy `_unused: never` field. Do not disable the rule.',
      }),
      extraType: agentDiagnostic({
        problem:
          'This component file declares an extra type or interface besides the primary component and its `*Props` type.',
        why: 'Extra aliases in a component file become a dumping ground. Domain types belong in their own modules.',
        fix: 'Keep only the component and `{Name}Props` here. Move other types to a dedicated file and import values (not the props type) as needed.',
        avoid:
          'Do not hide extra types inside the props type as unused fields. Do not disable the rule.',
      }),
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
      if (!hasPropsTypeAttempt(fn, init, variableAnnotation)) {
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
