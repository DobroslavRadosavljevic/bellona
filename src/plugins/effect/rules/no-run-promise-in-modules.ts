import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import {
  DEFAULT_ENTRY_OPTIONS,
  ENTRY_OPTION_SCHEMA,
  shouldSkipRunPromiseFile,
} from '../options.ts';

const RUNNERS = [
  'runPromise',
  'runPromiseExit',
  'runPromiseWith',
  'runPromiseExitWith',
  'runSync',
  'runSyncExit',
  'runSyncWith',
  'runFork',
  'runForkWith',
  'runCallback',
  'runCallbackWith',
] as const;

export const noRunPromiseInModulesName = bnRuleName('no-run-promise-in-modules');

export const noRunPromiseInModules: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Keep Effect.runPromise / runSync / runFork at process entry files, not in library modules',
    },
    messages: {
      run: agentDiagnostic({
        problem:
          'This module calls `Effect.runPromise` / `runSync` / `runFork` / `runCallback` (or `*With` / `*Exit` variants). That is a process edge, not a feature module.',
        why: 'Running inside a module hides the runtime and makes tests and layers optional. Effects should return `Effect` until `main`.',
        fix: 'Return the `Effect` from this function. Run it only in an entry file (`main.ts` / `runtime.ts` by default) with `NodeRuntime.runMain`, `BunRuntime.runMain`, `Layer.launch`, or `ManagedRuntime`. Add a path to `{ entry }` or `{ allow }` if this file is a true edge.',
        avoid:
          'Do not wrap `runPromise` in a helper named `run`. Do not disable the rule to “just execute it”.',
      }),
    },
    schema: [ENTRY_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ENTRY_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipRunPromiseFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        for (const name of RUNNERS) {
          if (isModuleCall(node, bindings, 'effect', name)) {
            context.report({ messageId: 'run', node });
            return;
          }
        }
      },
    };
  },
});
