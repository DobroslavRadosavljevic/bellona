import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getCallArgument,
  getStaticPropertyName,
  isFunctionLike,
  unwrapExpression,
  visitAstChildren,
} from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceClassSuper,
  isContextServiceValueCall,
  isEffectFnAppliedCall,
  isEffectFnUntracedCall,
  isEffectGenExpression,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { isTestFile, matchesAllow, slash } from '../filename.ts';
import { readAllowList } from '../options.ts';

export const effectFunctionsInServicesName = bnRuleName('effect-functions-in-services');

export const DEFAULT_SERVICE_FILES = ['.service.ts'];
export const DEFAULT_SERVICE_SOURCES = ['.service', '.service.ts'];
export const DEFAULT_BOUNDARIES = [
  '/routes/',
  '/live.ts',
  '/runtime.ts',
  '/server/',
  '/testing/',
  '/scripts/',
  '/src/index.ts',
  '/src/main.ts',
];

const STRING_LIST = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  uniqueItems: true,
} as const;

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: STRING_LIST,
    serviceFiles: STRING_LIST,
    serviceSources: STRING_LIST,
    servicePackages: STRING_LIST,
    services: STRING_LIST,
    boundaries: STRING_LIST,
  },
} as const;

/** Local names that refer to services, and namespaces that hold them. */
interface ServiceNames {
  readonly names: ReadonlySet<string>;
  readonly namespaces: ReadonlySet<string>;
}

function isPascalCase(name: string): boolean {
  return /^[A-Z]/u.test(name);
}

function importedName(specifier: ESTree.ImportSpecifier): string | undefined {
  const imported = specifier.imported;
  if (imported.type === 'Identifier') {
    return imported.name;
  }
  return imported.type === 'Literal' && isJsString(imported.value) ? imported.value : undefined;
}

function isContextReferenceSuper(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  let current = unwrapExpression(node);
  while (current?.type === 'CallExpression') {
    current = unwrapExpression(current.callee);
  }
  return isModuleMember(current, bindings, 'context', 'Reference');
}

/** Runner methods of `Effect` and of a `ManagedRuntime` value. */
const RUNNERS = new Set([
  'runPromise',
  'runPromiseExit',
  'runFork',
  'runSync',
  'runSyncExit',
  'runCallback',
]);

function isRunnerCall(node: ESTree.Node): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(node.callee);
  const name =
    callee?.type === 'MemberExpression' ? getStaticPropertyName(callee.property) : undefined;
  return name !== undefined && RUNNERS.has(name);
}

export const effectFunctionsInServices: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require module-level functions that use a service to be methods of a Context.Service',
    },
    messages: {
      capability: agentDiagnostic({
        problem:
          '`{{name}}` is a module-level function that uses service `{{service}}`. A function that needs a service is a capability.',
        why: 'Outside a service, the dependency is hidden in the function type. It is not part of a contract or a layer, so callers cannot replace it in tests and the owner is not clear.',
        fix: 'Make `{{name}}` a method of the service that owns this work (or of a new `Context.Service`), built in its `static readonly layer` with `yield* {{service}}`. Pure helpers that only use `Effect` / `Schema` / `Option` / `Predicate` can stay plain functions.',
        avoid: 'Do not pass the service in as a parameter to hide it. Do not disable the rule.',
      }),
    },
    schema: [OPTION_SCHEMA],
    defaultOptions: [
      {
        allow: [],
        serviceFiles: DEFAULT_SERVICE_FILES,
        serviceSources: DEFAULT_SERVICE_SOURCES,
        servicePackages: [],
        services: [],
        boundaries: DEFAULT_BOUNDARIES,
      },
    ],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let services: ServiceNames;

    return {
      before() {
        const options = objectOptionAt(context, 0);
        const filename = slash(context.filename);
        const serviceFiles = stringListField(options, 'serviceFiles', DEFAULT_SERVICE_FILES);
        const boundaries = stringListField(options, 'boundaries', DEFAULT_BOUNDARIES);
        if (
          isTestFile(filename) ||
          matchesAllow(filename, readAllowList(context)) ||
          serviceFiles.some((suffix) => filename.endsWith(suffix)) ||
          boundaries.some((part) => filename.includes(part))
        ) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        services = collectServiceNames(context.sourceCode.ast, {
          sources: stringListField(options, 'serviceSources', DEFAULT_SERVICE_SOURCES),
          packages: stringListField(options, 'servicePackages', []),
          names: stringListField(options, 'services', []),
        });
        if (services.names.size === 0 && services.namespaces.size === 0) {
          return false;
        }
      },
      Program(node) {
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ||
            statement.type === 'ExportDefaultDeclaration'
              ? statement.declaration
              : statement;
          if (declaration?.type === 'FunctionDeclaration') {
            check(declaration, declaration.id?.name ?? 'default', declaration.id ?? declaration);
          } else if (declaration?.type === 'VariableDeclaration') {
            for (const declarator of declaration.declarations) {
              const init = unwrapExpression(declarator.init ?? undefined);
              if (declarator.id.type === 'Identifier' && isEffectFunction(init)) {
                check(declarator, declarator.id.name, declarator.id);
              }
            }
          }
        }
      },
    };

    function collectServiceNames(
      program: ESTree.Program | undefined,
      config: {
        readonly sources: readonly string[];
        readonly packages: readonly string[];
        readonly names: readonly string[];
      },
    ): ServiceNames {
      const names = new Set(config.names);
      const namespaces = new Set<string>();
      for (const statement of program?.body ?? []) {
        if (statement.type === 'ImportDeclaration' && statement.importKind !== 'type') {
          const source = statement.source.value;
          if (!isJsString(source)) {
            continue;
          }
          const fromServiceFile = config.sources.some((suffix) => source.endsWith(suffix));
          const fromPackage = config.packages.some(
            (name) => source === name || source.startsWith(`${name}/`),
          );
          for (const specifier of statement.specifiers) {
            if (specifier.type === 'ImportSpecifier') {
              const exported = importedName(specifier);
              if (
                specifier.importKind !== 'type' &&
                exported !== undefined &&
                isPascalCase(exported) &&
                (fromServiceFile || fromPackage)
              ) {
                names.add(specifier.local.name);
              }
            } else if (fromServiceFile) {
              namespaces.add(specifier.local.name);
            }
          }
          continue;
        }
        const declaration =
          statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
        if (declaration?.type === 'ClassDeclaration' && declaration.id !== null) {
          const superClass = declaration.superClass ?? undefined;
          if (
            isContextServiceClassSuper(superClass, bindings) ||
            isContextReferenceSuper(superClass, bindings)
          ) {
            names.add(declaration.id.name);
          }
        } else if (declaration?.type === 'VariableDeclaration') {
          for (const declarator of declaration.declarations) {
            const init = unwrapExpression(declarator.init ?? undefined);
            if (
              declarator.id.type === 'Identifier' &&
              init?.type === 'CallExpression' &&
              isContextServiceValueCall(init, bindings)
            ) {
              names.add(declarator.id.name);
            }
          }
        }
      }
      return { names, namespaces };
    }

    /** A function, `Effect.fn(…)(…)`, `Effect.fnUntraced(…)`, or an `Effect.gen(…)` value. */
    function isEffectFunction(node: ESTree.Node | undefined): boolean {
      if (isFunctionLike(node)) {
        return true;
      }
      return (
        node?.type === 'CallExpression' &&
        (isEffectFnAppliedCall(node, bindings) ||
          isEffectFnUntracedCall(node, bindings) ||
          isEffectGenExpression(node, bindings))
      );
    }

    /** The service name when `node` refers to a service: `Database` or `Db.Database`. */
    function serviceName(node: ESTree.Node | undefined): string | undefined {
      const expression = unwrapExpression(node);
      if (expression?.type === 'Identifier') {
        return services.names.has(expression.name) ? expression.name : undefined;
      }
      if (expression?.type === 'MemberExpression') {
        const object = unwrapExpression(expression.object);
        const property = getStaticPropertyName(expression.property);
        if (object?.type === 'Identifier' && services.namespaces.has(object.name)) {
          return property === undefined ? undefined : `${object.name}.${property}`;
        }
      }
      return undefined;
    }

    /** The first service that `node` gets: `yield* X`, `X.use(…)`, or `Effect.service(X)`. */
    function serviceUse(node: ESTree.Node): string | undefined {
      if (node.type === 'YieldExpression' && node.delegate === true) {
        return serviceName(node.argument ?? undefined);
      }
      if (node.type !== 'CallExpression') {
        return undefined;
      }
      if (
        isModuleCall(node, bindings, 'effect', 'service') ||
        isModuleCall(node, bindings, 'effect', 'serviceOption')
      ) {
        return serviceName(getCallArgument(node, 0));
      }
      const callee = unwrapExpression(node.callee);
      if (callee?.type !== 'MemberExpression') {
        return undefined;
      }
      const method = getStaticPropertyName(callee.property);
      return method === 'use' || method === 'useSync' ? serviceName(callee.object) : undefined;
    }

    function check(declaration: ESTree.Node, name: string, reportNode: ESTree.Node): void {
      let service: string | undefined;
      let runs = false;
      const visit = (node: ESTree.Node): void => {
        if (runs) {
          return;
        }
        runs = isRunnerCall(node);
        service ??= serviceUse(node);
        visitAstChildren(node, visit);
      };
      visit(declaration);
      // A function that runs the Effect itself (`runtime.runPromise`, `Effect.runFork`) is an
      // adapter at the edge, such as a query function or a React hook. It is not a capability.
      if (service !== undefined && !runs) {
        context.report({ messageId: 'capability', node: reportNode, data: { name, service } });
      }
    }
  },
});
