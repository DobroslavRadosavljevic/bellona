import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipReactFile } from '../options.ts';

export const noReactNamespaceName = bnRuleName('no-namespace');

export const noReactNamespace: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow React namespace / default imports; prefer named imports',
    },
    messages: {
      namespaceImport: agentDiagnostic({
        problem: 'This file uses `import * as React from "react"` (a namespace import).',
        why: 'Namespace imports hide which React APIs this file uses and force `React.*` access, which this plugin also bans.',
        fix: 'Import named APIs: `import { useState, type ReactNode } from "react"`. List only what this file uses.',
        avoid:
          'Do not switch to `import React from "react"` (also banned). Do not keep `React.useState`. Do not disable the rule.',
      }),
      defaultImport: agentDiagnostic({
        problem: 'This file uses `import React from "react"` (a default import).',
        why: 'The default React namespace is the same smell as `import * as React`. Named imports are the public API.',
        fix: 'Import named APIs: `import { useState, type ReactNode } from "react"`.',
        avoid: 'Do not switch to `import * as React from "react"`. Do not disable the rule.',
      }),
      memberAccess: agentDiagnostic({
        problem: 'This expression uses `React.*` namespace access (for example `React.useState`).',
        why: 'Direct named imports show the dependency and match the rest of the React plugin.',
        fix: 'Add `useState` (or the used API) to the named import from `"react"` and call `useState` without the `React.` prefix.',
        avoid: 'Do not alias `const { useState } = React` in the file. Do not disable the rule.',
      }),
      typeAccess: agentDiagnostic({
        problem: 'This type uses `React.*` namespace types (for example `React.ReactNode`).',
        why: 'Type-only named imports are the same rule as value imports.',
        fix: 'Write `import { type ReactNode } from "react"` (or `import type { ReactNode } from "react"`) and use `ReactNode` directly.',
        avoid: 'Do not keep `import type React from "react"`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const reactBindings = new Set<string>();

    return {
      before() {
        reactBindings.clear();
        if (shouldSkipReactFile(context)) {
          return false;
        }
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'react' && node.source.value !== 'react/jsx-runtime') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            reactBindings.add(specifier.local.name);
            context.report({ messageId: 'namespaceImport', node: specifier });
            continue;
          }
          if (specifier.type === 'ImportDefaultSpecifier') {
            reactBindings.add(specifier.local.name);
            context.report({ messageId: 'defaultImport', node: specifier });
          }
        }
      },
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          (reactBindings.has(node.object.name) || node.object.name === 'React')
        ) {
          context.report({ messageId: 'memberAccess', node });
        }
      },
      TSQualifiedName(node) {
        if (
          node.left.type === 'Identifier' &&
          (reactBindings.has(node.left.name) || node.left.name === 'React')
        ) {
          context.report({ messageId: 'typeAccess', node });
        }
      },
    };
  },
});
