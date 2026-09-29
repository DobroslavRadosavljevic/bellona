import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression, visitAstChildren } from '../ast.ts';
import { collectEffectBindings, isContextServiceMember, type EffectBindings } from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noInferredServiceContractName = bnRuleName('no-inferred-service-contract');

/**
 * Local names for the `Effect` module in type positions. A type-only import such as
 * `import type { Effect } from 'effect'` counts here, so `collectEffectBindings` is not enough.
 */
function effectTypeNames(program: ESTree.Program | undefined): ReadonlySet<string> {
  const names = new Set<string>(['Effect']);
  for (const statement of program?.body ?? []) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value;
    if (!isJsString(source)) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier') {
        const imported = specifier.imported;
        const name = imported.type === 'Identifier' ? imported.name : imported.value;
        if (source === 'effect' && name === 'Effect') {
          names.add(specifier.local.name);
        }
      } else if (source === 'effect/Effect') {
        names.add(specifier.local.name);
      }
    }
  }
  return names;
}

/** Top-level `type Name = …` declarations, exported or not. */
function typeAliases(program: ESTree.Program | undefined): ReadonlyMap<string, ESTree.TSType> {
  const aliases = new Map<string, ESTree.TSType>();
  for (const statement of program?.body ?? []) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type === 'TSTypeAliasDeclaration') {
      aliases.set(declaration.id.name, declaration.typeAnnotation);
    }
  }
  return aliases;
}

function typeQueryName(node: ESTree.TSType | undefined): string | undefined {
  if (node?.type !== 'TSTypeQuery') {
    return undefined;
  }
  const exprName = node.exprName;
  if (exprName.type === 'Identifier') {
    return exprName.name;
  }
  if (exprName.type === 'TSQualifiedName') {
    return exprName.right.name;
  }
  return undefined;
}

function isReturnTypeOf(node: ESTree.TSType | undefined): node is ESTree.TSTypeReference {
  return (
    node?.type === 'TSTypeReference' &&
    node.typeName.type === 'Identifier' &&
    node.typeName.name === 'ReturnType' &&
    typeQueryName(node.typeArguments?.params[0]) !== undefined
  );
}

function isEffectSuccess(node: ESTree.TSTypeReference, effectNames: ReadonlySet<string>): boolean {
  const typeName = node.typeName;
  return (
    typeName.type === 'TSQualifiedName' &&
    typeName.right.name === 'Success' &&
    typeName.left.type === 'Identifier' &&
    effectNames.has(typeName.left.name)
  );
}

/**
 * True for `Effect.Success<typeof x>`, `Effect.Success<ReturnType<typeof x>>`, and
 * `ReturnType<typeof make…>`. A `ReturnType` of a function that does not start with `make`
 * is often a third-party client type, so it is allowed.
 */
function isInferredContract(node: ESTree.Node, effectNames: ReadonlySet<string>): boolean {
  if (node.type !== 'TSTypeReference') {
    return false;
  }
  if (isEffectSuccess(node, effectNames)) {
    const argument = node.typeArguments?.params[0];
    return typeQueryName(argument) !== undefined || isReturnTypeOf(argument);
  }
  if (!isReturnTypeOf(node)) {
    return false;
  }
  return typeQueryName(node.typeArguments?.params[0])?.startsWith('make') === true;
}

/** The first inferred type inside `node`. Follows local type aliases one time each. */
function findInferred(
  node: ESTree.Node,
  effectNames: ReadonlySet<string>,
  aliases: ReadonlyMap<string, ESTree.TSType>,
  seen: Set<string>,
): ESTree.Node | undefined {
  if (isInferredContract(node, effectNames)) {
    return node;
  }
  if (
    node.type === 'TSTypeReference' &&
    node.typeName.type === 'Identifier' &&
    !seen.has(node.typeName.name)
  ) {
    const alias = aliases.get(node.typeName.name);
    if (alias !== undefined) {
      seen.add(node.typeName.name);
      const found = findInferred(alias, effectNames, aliases, seen);
      if (found !== undefined) {
        return found;
      }
    }
  }
  let found: ESTree.Node | undefined;
  visitAstChildren(node, (child) => {
    found ??= findInferred(child, effectNames, aliases, seen);
  });
  return found;
}

export const noInferredServiceContract: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a Context.Service shape that is inferred from a factory with Effect.Success or ReturnType',
    },
    messages: {
      inferred: agentDiagnostic({
        problem:
          'The `Context.Service` shape is inferred from an implementation: `{{type}}`. The service has no written contract.',
        why: 'The contract is the one place that shows the inputs, results, errors, and dependencies of each method. An inferred shape changes when the implementation changes, so callers break without warning. The shape also shows internal helpers.',
        fix: 'Write the shape in the class: `Context.Service<Service, { readonly method: (input: Input) => Effect.Effect<Output, SomeError> }>()`. Then build the object in `static readonly layer` with `Service.of({ … })`.',
        avoid:
          'Do not move the inferred type into a type alias or an interface. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let effectNames: ReadonlySet<string>;
    let aliases: ReadonlyMap<string, ESTree.TSType>;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        effectNames = effectTypeNames(context.sourceCode.ast);
        aliases = typeAliases(context.sourceCode.ast);
      },
      CallExpression(node) {
        if (!isContextServiceMember(unwrapExpression(node.callee), bindings)) {
          return;
        }
        const params = node.typeArguments?.params ?? [];
        const contract = params[params.length - 1];
        if (contract === undefined) {
          return;
        }
        const found = findInferred(contract, effectNames, aliases, new Set());
        if (found === undefined) {
          return;
        }
        context.report({
          messageId: 'inferred',
          node: contract,
          data: { type: context.sourceCode.getText(found) },
        });
      },
    };
  },
});
