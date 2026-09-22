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

export const requireServiceFilenameName = bnRuleName('require-service-filename');

export const requireServiceFilename: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Require files that define Context.Service to end with .service.ts' },
    messages: {
      filename: agentDiagnostic({
        problem: 'This file defines a service but its name does not end with .service.ts.',
        why: 'A shared filename suffix makes service files easy to find.',
        fix: 'Rename this file to end with .service.ts and update its imports.',
        avoid: 'Do not hide service definitions behind aliases or disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let reported: boolean;

    return {
      before() {
        reported = false;
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

        if (reported || context.filename.endsWith('.service.ts')) {
          return;
        }
        reported = true;
        context.report({ messageId: 'filename', node });
      },
    };
  },
});
