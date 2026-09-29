import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isEffectRunnerMember, type EffectBindings } from '../bindings.ts';
import { collectModuleNames, isModuleNameMember, type ModuleNames } from '../module-names.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipNonTestEffectFile,
} from '../options.ts';

export const noEffectRunInTestsName = bnRuleName('no-effect-run-in-tests');

export const noEffectRunInTests: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Effect.run* and ManagedRuntime.make in test files; use it.effect and it.layer',
    },
    messages: {
      run: agentDiagnostic({
        problem: 'This test runs an Effect with `{{api}}`. Use `@effect/vitest`.',
        why: '`it.effect` runs the Effect with `TestClock`, a scope, and the Vitest abort signal, and it prints the full `Cause` when the test fails. `{{api}}` skips all of that, so time is real and failures show less detail.',
        fix: 'Write `it.effect("name", () => Effect.gen(function* () { … }))`. For shared services, use `layer(AppLayer)((it) => { … })` or `it.layer(AppLayer)` instead of `ManagedRuntime.make`.',
        avoid: 'Do not wrap `Effect.runPromise` in a helper. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let managedRuntime: ModuleNames;

    return {
      before() {
        if (shouldSkipNonTestEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        managedRuntime = collectModuleNames(context.sourceCode.ast, 'ManagedRuntime');
      },
      MemberExpression(node) {
        check(node);
      },
      Identifier(node) {
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node)
        ) {
          return;
        }
        check(node);
      },
    };

    function check(node: ESTree.Node): void {
      if (isEffectRunnerMember(node, bindings)) {
        context.report({ messageId: 'run', node, data: { api: apiName(node, 'Effect') } });
        return;
      }
      if (isModuleNameMember(node, managedRuntime, 'ManagedRuntime', 'make')) {
        context.report({ messageId: 'run', node, data: { api: 'ManagedRuntime.make' } });
      }
    }
  },
});

function apiName(node: ESTree.Node, owner: string): string {
  const expression = unwrapExpression(node);
  const name =
    expression?.type === 'MemberExpression'
      ? getStaticPropertyName(expression.property)
      : expression?.type === 'Identifier'
        ? expression.name
        : undefined;
  return `${owner}.${name ?? 'run'}`;
}
