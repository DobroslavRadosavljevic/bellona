import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
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

export const noRunPromiseInModulesName = vmRuleName('no-run-promise-in-modules');

export const noRunPromiseInModules: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Keep Effect.runPromise / runSync / runFork at process entry files, not in library modules',
    },
    messages: {
      run: 'Run effects at the process edge (NodeRuntime.runMain, BunRuntime.runMain, Layer.launch, or ManagedRuntime).',
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
