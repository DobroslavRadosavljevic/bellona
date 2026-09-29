import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noServiceMakeFactoryName = bnRuleName('no-service-make-factory');

/**
 * The name of a separately defined factory: `make` in `Layer.effect(Svc, make)` or
 * `Layer.effect(Svc, make(options))`. A named import from an `effect` module, such as
 * `gen` from `effect/Effect`, is inline code, not a factory.
 * A helper that this file exports is shared with other modules, so it is skipped too.
 */
function factoryName(node: ESTree.Node | undefined, bindings: EffectBindings): string | undefined {
  const expression = unwrapExpression(node);
  const target =
    expression?.type === 'CallExpression' ? unwrapExpression(expression.callee) : expression;
  if (target?.type !== 'Identifier' || bindings.named.has(target.name)) {
    return undefined;
  }
  return target.name;
}

/** Names that this file exports. An exported helper is shared with other modules. */
function exportedNames(program: ESTree.Program | undefined): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of program?.body ?? []) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.source !== null) {
      continue;
    }
    const declaration = statement.declaration;
    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier') {
          names.add(declarator.id.name);
        }
      }
    } else if (declaration?.type === 'FunctionDeclaration' && declaration.id !== null) {
      names.add(declaration.id.name);
    }
    for (const specifier of statement.specifiers) {
      if (specifier.local.type === 'Identifier') {
        names.add(specifier.local.name);
      }
    }
  }
  return names;
}

export const noServiceMakeFactory: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require Layer.effect to build a service inline, not through a separately defined factory',
    },
    messages: {
      factory: agentDiagnostic({
        problem:
          '`Layer.effect` gets the service from `{{name}}`, a factory defined somewhere else. The construction is not in the layer.',
        why: 'The layer is the one place that builds the service. A separate factory splits the construction, invites a second caller, and often leads to contracts inferred from the factory type.',
        fix: 'Move the body of `{{name}}` into `Layer.effect(Service, Effect.gen(function* () { … return Service.of({ … }) }))`. When the class uses `options.make`, write `Layer.effect(this, this.make)`.',
        avoid:
          'Do not rename the factory, and do not wrap it in `Effect.suspend`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let exported: ReadonlySet<string>;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        exported = exportedNames(context.sourceCode.ast);
      },
      CallExpression(node) {
        if (!isModuleCall(node, bindings, 'layer', 'effect')) {
          return;
        }
        const name = factoryName(getCallArgument(node, 1), bindings);
        if (name === undefined || exported.has(name)) {
          return;
        }
        context.report({ messageId: 'factory', node, data: { name } });
      },
    };
  },
});
