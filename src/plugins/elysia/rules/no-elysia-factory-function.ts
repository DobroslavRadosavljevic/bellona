import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike } from '../ast.ts';
import { subtreeCreatesElysia } from '../elysia.ts';
import { DEFAULT_FACTORY_DIRECTORIES, shouldSkipFactoryFunctionFile } from '../options.ts';

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

/** A module-level function and the node to report (its name when it has one). */
interface ModuleFunction {
  readonly fn: FunctionNode;
  readonly name: string;
  readonly reportNode: ESTree.Node;
}

/** Functions declared at module level: declarations, `const f = () => …`, and export forms. */
function collectModuleFunctions(program: ESTree.Program): ModuleFunction[] {
  const found: ModuleFunction[] = [];

  const addDeclaration = (declaration: ESTree.Node | null | undefined) => {
    if (!declaration) {
      return;
    }
    if (declaration.type === 'FunctionDeclaration') {
      found.push({
        fn: declaration,
        name: declaration.id?.name ?? 'default',
        reportNode: declaration.id ?? declaration,
      });
      return;
    }
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier' && isFunctionLike(declarator.init)) {
          found.push({ fn: declarator.init, name: declarator.id.name, reportNode: declarator.id });
        }
      }
    }
  };

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration') {
      addDeclaration(statement.declaration);
      continue;
    }
    if (statement.type === 'ExportDefaultDeclaration') {
      const { declaration } = statement;
      if (declaration.type === 'FunctionDeclaration') {
        addDeclaration(declaration);
      } else if (isFunctionLike(declaration)) {
        found.push({ fn: declaration, name: 'default', reportNode: declaration });
      }
      continue;
    }
    addDeclaration(statement);
  }
  return found;
}

/**
 * Disallow module-level functions that build `new Elysia(…)` (route or plugin
 * factories) under `directories` (default `/modules/`, `/routes/`). A factory
 * hides the route behind a call and invites passing app singletons (database,
 * Effect runtime) as arguments. Declare one module-level instance instead.
 */
export const noElysiaFactoryFunctionName = bnRuleName('no-elysia-factory-function');

export const noElysiaFactoryFunction: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipFactoryFunctionFile(context)) {
          return false;
        }
      },
      Program(node) {
        for (const { fn, name, reportNode } of collectModuleFunctions(node)) {
          if (subtreeCreatesElysia(fn.body ?? undefined)) {
            context.report({ messageId: 'factory', data: { name }, node: reportNode });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow module-level functions that build new Elysia() (route/plugin factories) in modules/routes',
    },
    messages: {
      factory: agentDiagnostic({
        problem:
          'Function `{{name}}` builds `new Elysia(…)`. It is a route or plugin factory in a directory that the `directories` option covers (default `/modules/`, `/routes/`).',
        why: 'A factory hides the route behind a call. Callers then pass app singletons (the database, the Effect runtime) as arguments. Each call also makes a new instance, which plugin dedup by `name` cannot merge.',
        fix: 'Declare one module-level instance: `export const featureActionRoute = new Elysia({ name: "FEATURE_ACTION_ROUTE" }).get(…)`. Import the database and runtime modules directly in the files that use them.',
        avoid:
          'Do not pass `db` or `runtime` into the route. Do not move the factory to another name in the same folder. Do not disable the rule. Set `{ directories }` only for true exceptions.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          directories: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
          allow: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
        },
      },
    ],
    defaultOptions: [{ directories: [...DEFAULT_FACTORY_DIRECTORIES], allow: [] }],
    type: 'suggestion',
  },
});
