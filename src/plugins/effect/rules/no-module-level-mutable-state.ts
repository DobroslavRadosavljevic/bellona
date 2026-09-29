import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { parentOf } from '../ast.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noModuleLevelMutableStateName = bnRuleName('no-module-level-mutable-state');

export const noModuleLevelMutableState: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a module-level let or var that the code writes again, in files that import effect',
    },
    messages: {
      mutable: agentDiagnostic({
        problem:
          'The module-level variable `{{name}}` is written after it is declared. It is shared state that no layer owns.',
        why: 'Module state lives for the whole process and is shared by all requests, runtimes, and tests. Effect cannot scope it, reset it, or release it. Two runtimes in one process see the same value.',
        fix: 'Keep the state in a `Ref` (or `SynchronizedRef`, `Cache`, `RcRef`) that a layer makes: `const state = yield* Ref.make(initial)` in the `Layer.effect` generator. Give access to it through the service methods.',
        avoid: 'Do not wrap the variable in an object to hide the write. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
      },
      VariableDeclaration(node) {
        if ((node.kind !== 'let' && node.kind !== 'var') || node.declare === true) {
          return;
        }
        const parent = parentOf(node);
        const atModuleLevel =
          parent?.type === 'Program' ||
          (parent?.type === 'ExportNamedDeclaration' && parentOf(parent)?.type === 'Program');
        if (!atModuleLevel) {
          return;
        }
        for (const variable of context.sourceCode.getDeclaredVariables(node)) {
          const written = variable.references.some(
            (reference) => reference.isWrite() && !reference.init,
          );
          const identifier = variable.identifiers[0];
          if (!written || identifier === undefined) {
            continue;
          }
          context.report({ messageId: 'mutable', node: identifier, data: { name: variable.name } });
        }
      },
    };
  },
});
