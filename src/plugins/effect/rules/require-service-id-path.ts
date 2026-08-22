import type { CreateOnceRule } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import {
  collectEffectBindings,
  isContextServiceClassKeyCall,
  isContextServiceValueCall,
  serviceIdLiteral,
  type EffectBindings,
} from '../bindings.ts';
import { isServiceIdPath } from '../filename.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const requireServiceIdPathName = vmRuleName('require-service-id-path');

export const requireServiceIdPath: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Context.Service identifiers to look like pkg/dir/Name',
    },
    messages: {
      path: 'Use a service id like "myapp/db/Database", not "{{id}}".',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
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
        const id = serviceIdLiteral(node, bindings);
        if (id === undefined || isServiceIdPath(id)) {
          return;
        }
        context.report({ messageId: 'path', node, data: { id } });
      },
    };
  },
});
