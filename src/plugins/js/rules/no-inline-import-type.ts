import type { CreateOnceRule } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

export const noInlineImportTypeName = bnRuleName('no-inline-import-type');

export const noInlineImportType: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow TypeScript import() types. Use a top-level type import instead of an inline module type.',
    },
    messages: {
      inlineImportType: agentDiagnostic({
        problem:
          'This type uses an inline TypeScript `import("{{source}}")` (including `import("{{source}}").Name` and `typeof import("{{source}}")`). A runtime `import("{{source}}")` expression is not this rule.',
        why: 'Inline `import()` types hide the module graph inside a type position. Tools, refactors, and readers cannot see the dependency at the top of the file.',
        fix: 'Add a top-level type import, then use the imported name. Example: `import type { LightboxTravel } from "{{source}}"` then `useRef<LightboxTravel | null>(null)`.',
        avoid:
          'Do not keep `import("{{source}}")` in a type alias. Do not switch to `require()`. Do not disable the rule. Runtime dynamic `import()` for values is allowed and is not the fix here.',
      }),
    },
  },
  createOnce(context) {
    return {
      TSImportType(node) {
        const source = node.source.value;
        context.report({
          node,
          messageId: 'inlineImportType',
          data: { source: isJsString(source) ? source : '' },
        });
      },
    };
  },
});
