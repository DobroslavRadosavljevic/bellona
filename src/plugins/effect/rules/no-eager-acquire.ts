import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, pipeRoot, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { collectConstValues } from '../const-values.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noEagerAcquireName = bnRuleName('no-eager-acquire');

export const noEagerAcquire: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Effect.acquireRelease acquire steps that build the resource before the Effect runs',
    },
    messages: {
      eager: agentDiagnostic({
        problem:
          'The acquire step is `Effect.succeed(…)` of a resource that is already built. The resource exists before `acquireRelease` runs.',
        why: '`Effect.succeed` takes a value that JavaScript makes at once, when the code builds the Effect. If the Effect never runs, or the fiber is interrupted first, the release step never runs and the resource leaks. The resource is also shared by each run of the Effect.',
        fix: 'Build the resource inside the acquire Effect: `Effect.sync(() => new Client())`, or `Effect.tryPromise({ try: () => connect(), catch: … })` for async work.',
        avoid: 'Do not move the constructor to a `const` above the call. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let consts: ReadonlyMap<string, ESTree.Node>;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        consts = collectConstValues(context.sourceCode.ast);
      },
      CallExpression(node) {
        if (
          !isModuleCall(node, bindings, 'effect', 'acquireRelease') &&
          !isModuleCall(node, bindings, 'effect', 'acquireUseRelease')
        ) {
          return;
        }
        const acquire = resolve(getCallArgument(node, 0));
        const root = pipeRoot(acquire);
        if (root?.type !== 'CallExpression' || !isModuleCall(root, bindings, 'effect', 'succeed')) {
          return;
        }
        const value = resolve(getCallArgument(root, 0));
        if (value?.type !== 'NewExpression' && value?.type !== 'CallExpression') {
          return;
        }
        context.report({ messageId: 'eager', node: root });
      },
    };

    /** A same-file `const` name → its initializer. */
    function resolve(node: ESTree.Node | undefined): ESTree.Node | undefined {
      const expression = unwrapExpression(node);
      if (expression?.type === 'Identifier') {
        return unwrapExpression(consts.get(expression.name)) ?? expression;
      }
      return expression;
    }
  },
});
