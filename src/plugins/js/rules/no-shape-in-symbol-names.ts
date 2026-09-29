import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

const DEFAULT_TERM = 'shape';

type NamedNode = ESTree.Node & { name: string };

const memberDeclarationKinds: ReadonlySet<string> = new Set([
  'AccessorProperty',
  'MethodDefinition',
  'PropertyDefinition',
  'TSAbstractAccessorProperty',
  'TSAbstractMethodDefinition',
  'TSAbstractPropertyDefinition',
  'TSMethodSignature',
  'TSPropertySignature',
]);

function moduleExportName(node: ESTree.ModuleExportName): string {
  return node.type === 'Literal' ? String(node.value) : node.name;
}

function isParameterOf(parent: ESTree.Node, node: NamedNode): boolean {
  if (!('params' in parent)) return false;
  const parameters: readonly ESTree.Node[] = parent.params;
  return parameters.some((parameter) => parameter === node);
}

/**
 * Report a name only where this file declares it. A read of `schema.shape`, an
 * `import { Shape }` that keeps the source module name, a JSX tag, or an object
 * key sent to an API uses a name that another module owns. This file cannot
 * rename it, and a declaration already reports its own uses.
 */
function isDeclaredName(node: NamedNode): boolean {
  const parent = node.parent;
  if (parent === null) return false;
  if (memberDeclarationKinds.has(parent.type)) {
    return (
      'key' in parent &&
      parent.key === node &&
      !('computed' in parent && parent.computed === true) &&
      !('override' in parent && parent.override === true)
    );
  }
  switch (parent.type) {
    case 'VariableDeclarator':
      return parent.id === node;
    case 'ClassDeclaration':
    case 'ClassExpression':
    case 'TSEnumDeclaration':
    case 'TSEnumMember':
    case 'TSInterfaceDeclaration':
    case 'TSModuleDeclaration':
    case 'TSTypeAliasDeclaration':
      return parent.id === node;
    case 'ArrowFunctionExpression':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'TSDeclareFunction':
    case 'TSEmptyBodyFunctionExpression':
      return ('id' in parent && parent.id === node) || isParameterOf(parent, node);
    case 'TSCallSignatureDeclaration':
    case 'TSConstructSignatureDeclaration':
    case 'TSConstructorType':
    case 'TSFunctionType':
      return isParameterOf(parent, node);
    case 'TSTypeParameter':
      return parent.name === node;
    case 'CatchClause':
      return parent.param === node;
    case 'TSParameterProperty':
      return parent.parameter === node;
    case 'AssignmentPattern':
      return parent.left === node;
    case 'RestElement':
      return parent.argument === node;
    case 'ArrayPattern':
      return true;
    case 'Property':
      return parent.value === node && parent.parent.type === 'ObjectPattern';
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
      return parent.local === node;
    case 'ImportSpecifier':
      return parent.local === node && moduleExportName(parent.imported) !== node.name;
    case 'ExportSpecifier':
      return (
        parent.exported === node &&
        moduleExportName(parent.exported) !== moduleExportName(parent.local)
      );
    default:
      return false;
  }
}

function containsForbiddenTerm(name: string, needle: string, caseSensitive: boolean): boolean {
  if (caseSensitive) {
    return name.includes(needle);
  }
  return name.toLowerCase().includes(needle);
}

/** Ban a configurable substring (default `shape`) in the names that a file declares. */
export const forbiddenTermInNamesId = bnRuleName('no-shape-in-symbol-names');

export const forbiddenTermInNames: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a configurable substring in JavaScript and TypeScript names that the file declares.',
    },
    messages: {
      forbiddenSymbolName: agentDiagnostic({
        problem:
          'Symbol "{{name}}" contains "{{term}}". The default term is `shape` (case-insensitive unless `{ caseSensitive: true }`). The rule checks names that this file declares: bindings, parameters, types, members, private fields, import aliases, and export aliases.',
        why: 'The word describes structure, not ownership. Names like `UserShape` do not say who owns the type, so later code treats the structure as the domain.',
        fix: 'Rename to an owner name: `UserShape` → `User` or `ParsedUser`. Remove "{{term}}" from the identifier.',
        avoid:
          'Do not hide the term with a typo (`shap`, `ShapeImpl` still matches by default). Do not disable the rule. Change the identifier.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          term: { type: 'string' },
          caseSensitive: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [{ term: DEFAULT_TERM }],
  },
  createOnce(context) {
    let term = DEFAULT_TERM;
    let caseSensitive = false;
    let needle = DEFAULT_TERM;

    const reportForbiddenSymbolName = (node: NamedNode) => {
      if (!containsForbiddenTerm(node.name, needle, caseSensitive) || !isDeclaredName(node)) {
        return;
      }
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name, term },
      });
    };

    return {
      before() {
        const options = objectOptionAt(context, 0);
        term = stringField(options, 'term', DEFAULT_TERM);
        caseSensitive = booleanField(options, 'caseSensitive', false);
        needle = caseSensitive ? term : term.toLowerCase();
      },
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
    };
  },
});
