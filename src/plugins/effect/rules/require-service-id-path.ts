import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
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

export const requireServiceIdPathName = bnRuleName('require-service-id-path');

export const requireServiceIdPath: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Context.Service identifiers to look like pkg/dir/Name',
    },
    messages: {
      path: agentDiagnostic({
        problem:
          'This `Context.Service` id is `"{{id}}"`. It must look like `"pkg/dir/Name"` (two or more non-empty `/` segments), not a single token like `"Database"`.',
        why: 'Service ids are unique keys in the context. A short name collides across packages.',
        fix: 'Use a path id: `Context.Service<Database, { … }>()("myapp/db/Database", { … })`.',
        avoid: 'Do not use `"Database"` or a UUID. Do not disable the rule.',
      }),
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
