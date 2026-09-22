import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  collectEffectBindings,
  isContextServiceClassKeyCall,
  isContextServiceValueCall,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const maxServicesName = bnRuleName('max-services');

export const maxServices: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Allow at most one Context.Service definition per file' },
    messages: {
      maxServices: agentDiagnostic({
        problem: 'This file defines more than one service.',
        why: 'One service per file keeps each service easy to find and change.',
        fix: 'Move each extra service into its own .service.ts file.',
        avoid: 'Do not hide service definitions behind aliases or disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let serviceCount: number;

    return {
      before() {
        serviceCount = 0;
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        if (
          !isContextServiceValueCall(node, bindings) &&
          !isContextServiceClassKeyCall(node, bindings)
        ) {
          return;
        }
        serviceCount += 1;
        if (serviceCount !== 2) {
          return;
        }

        context.report({ messageId: 'maxServices', node });
      },
    };
  },
});
