import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

function referencedAliasName(type: ESTree.TSType): string | null {
  if (type.type === 'TSParenthesizedType') return referencedAliasName(type.typeAnnotation);
  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') return null;
  return type.typeArguments === null ||
    type.typeArguments === undefined ||
    type.typeArguments.params.length === 0
    ? type.typeName.name
    : null;
}

/** Ban named aliases that merely conceal TypeScript's unknown top type. */
export const noUnknownTypeAliasesName = bnRuleName('no-unknown-type-aliases');

export const noUnknownTypeAliases: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary.',
    },
    messages: {
      unknownAlias: agentDiagnostic({
        problem:
          'Type alias `{{alias}}` is `unknown`, or it resolves to `unknown` through other aliases in this file (`type Foo = unknown` or `type Foo = Bar` where `Bar` is unknown).',
        why: 'The alias hides that the value is still unparsed. Callers treat `{{alias}}` as a domain type when it is still the top type.',
        fix: 'Keep `unknown` visible only at the parse boundary (the function that decodes I/O). After parse, use the named owner type. `cause` on errors may stay `unknown`.',
        avoid:
          'Do not rename `unknown` to `Json`, `Payload`, or `Data` without a schema. Do not use `any`. Do not disable the rule.',
      }),
    },
  },
  createOnce(context) {
    const aliases = new Map<string, ESTree.TSTypeAliasDeclaration>();

    const resolvesToUnknown = (type: ESTree.TSType, visited = new Set<string>()): boolean => {
      if (type.type === 'TSUnknownKeyword') return true;
      if (type.type === 'TSParenthesizedType')
        return resolvesToUnknown(type.typeAnnotation, visited);
      const name = referencedAliasName(type);
      if (name === null || visited.has(name)) return false;
      const alias = aliases.get(name);
      if (
        alias === undefined ||
        (alias.typeParameters !== null && alias.typeParameters !== undefined)
      ) {
        return false;
      }
      const nextVisited = new Set(visited);
      nextVisited.add(name);
      return resolvesToUnknown(alias.typeAnnotation, nextVisited);
    };

    return {
      Program(node) {
        aliases.clear();
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
          if (declaration?.type === 'TSTypeAliasDeclaration') {
            aliases.set(declaration.id.name, declaration);
          }
        }
        for (const alias of aliases.values()) {
          if (!resolvesToUnknown(alias.typeAnnotation, new Set([alias.id.name]))) continue;
          context.report({
            node: alias.id,
            messageId: 'unknownAlias',
            data: { alias: alias.id.name },
          });
        }
      },
    };
  },
});
