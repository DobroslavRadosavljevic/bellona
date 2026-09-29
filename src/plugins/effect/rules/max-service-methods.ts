import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { integerField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  classNameOf,
  getBindingNameForInitializer,
  getStaticPropertyName,
  unwrapExpression,
  visitAstChildren,
} from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceMember,
  isContextServiceValueCall,
  type EffectBindings,
} from '../bindings.ts';
import { shouldSkipEffectFile } from '../options.ts';

export const maxServiceMethodsName = bnRuleName('max-service-methods');

/**
 * Measured on a real Effect v4 backend with 119 services: median 2, p90 5, p95 7, largest 20.
 * 10 flags only the few services that are far above the rest.
 */
export const DEFAULT_MAX_SERVICE_METHODS = 10;

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
    max: { type: 'integer', minimum: 1 },
  },
} as const;

/** Member counts of `interface X { … }` and `type X = { … }` in this file. */
function collectTypeMemberCounts(program: ESTree.Program | undefined): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const statement of program?.body ?? []) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type === 'TSInterfaceDeclaration') {
      counts.set(declaration.id.name, declaration.body.body.length);
    } else if (
      declaration?.type === 'TSTypeAliasDeclaration' &&
      declaration.typeAnnotation.type === 'TSTypeLiteral'
    ) {
      counts.set(declaration.id.name, declaration.typeAnnotation.members.length);
    }
  }
  return counts;
}

/** The number of members of an object literal. Undefined when it has a spread. */
function objectMemberCount(node: ESTree.Node | undefined): number | undefined {
  const object = unwrapExpression(node);
  if (object?.type !== 'ObjectExpression') {
    return undefined;
  }
  if (object.properties.some((property) => property.type === 'SpreadElement')) {
    return undefined;
  }
  return object.properties.length;
}

export const maxServiceMethods: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit the number of members in a Context.Service contract',
    },
    messages: {
      tooMany: agentDiagnostic({
        problem:
          'Service `{{name}}` has {{count}} members. The limit is {{max}}. It does too many jobs.',
        why: 'A large service mixes several capabilities. Callers then depend on work they do not use, tests must fake every member, and one change touches many callers.',
        fix: 'Split `{{name}}` by capability: move each group of related members into its own `Context.Service` with its own layer. Keep the members that share state together.',
        avoid:
          'Do not move members into one object-typed member to lower the count. Do not raise `max` for one service. Do not disable the rule.',
      }),
    },
    schema: [OPTION_SCHEMA],
    defaultOptions: [{ allow: [], max: DEFAULT_MAX_SERVICE_METHODS }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let typeCounts: ReadonlyMap<string, number>;
    let max: number;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        typeCounts = collectTypeMemberCounts(context.sourceCode.ast);
        max = integerField(objectOptionAt(context, 0), 'max', DEFAULT_MAX_SERVICE_METHODS);
      },
      ClassDeclaration(node) {
        checkClass(node);
      },
      ClassExpression(node) {
        checkClass(node);
      },
      CallExpression(node) {
        // Value form: `const Db = Context.Service<Db, Shape>("app/Db")`.
        if (!isContextServiceValueCall(node, bindings)) {
          return;
        }
        const params = node.typeArguments?.params ?? [];
        const name = getBindingNameForInitializer(node);
        const count = contractCount(params[params.length - 1]);
        if (name !== undefined && count !== undefined) {
          report(node, name, count);
        }
      },
    };

    function checkClass(node: ESTree.Class): void {
      const superClass = unwrapExpression(node.superClass ?? undefined);
      if (superClass?.type !== 'CallExpression') {
        return;
      }
      const factory = unwrapExpression(superClass.callee);
      if (
        factory?.type !== 'CallExpression' ||
        factory.arguments.length > 0 ||
        !isContextServiceMember(factory.callee, bindings)
      ) {
        return;
      }
      const name = classNameOf(node);
      if (name === undefined) {
        return;
      }
      const count = contractCount(factory.typeArguments?.params[1]) ?? ofCount(node, name);
      if (count !== undefined) {
        report(node.id ?? node, name, count);
      }
    }

    /** Members of the contract type: a type literal, or a same-file interface / type alias. */
    function contractCount(node: ESTree.Node | undefined): number | undefined {
      if (node?.type === 'TSTypeLiteral') {
        return node.members.length;
      }
      if (node?.type === 'TSTypeReference' && node.typeName.type === 'Identifier') {
        return typeCounts.get(node.typeName.name);
      }
      return undefined;
    }

    /** Members of the largest `Name.of({ … })` object inside the class. */
    function ofCount(cls: ESTree.Class, name: string): number | undefined {
      let largest: number | undefined;
      const visit = (child: ESTree.Node): void => {
        if (child.type === 'CallExpression') {
          const callee = unwrapExpression(child.callee);
          if (
            callee?.type === 'MemberExpression' &&
            getStaticPropertyName(callee.property) === 'of'
          ) {
            const owner = unwrapExpression(callee.object);
            const isOwner =
              owner?.type === 'ThisExpression' ||
              (owner?.type === 'Identifier' && owner.name === name);
            const count = isOwner ? objectMemberCount(child.arguments[0]) : undefined;
            if (count !== undefined) {
              largest = Math.max(largest ?? 0, count);
            }
          }
        }
        visitAstChildren(child, visit);
      };
      visit(cls.body);
      return largest;
    }

    function report(node: ESTree.Node, name: string, count: number): void {
      if (count <= max) {
        return;
      }
      context.report({
        messageId: 'tooMany',
        node,
        data: { name, count: String(count), max: String(max) },
      });
    }
  },
});
