import type { CreateOnceRule } from '@oxlint/plugins';

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
      namespaceImport:
        'Import React APIs directly, e.g. `import { useState } from "react"`, instead of `import * as React from "react"`.',
      defaultImport:
        'Import React APIs directly, e.g. `import { useState } from "react"`, instead of `import React from "react"`.',
      memberAccess: 'Use direct React imports instead of `React.*` namespace access.',
      typeAccess: 'Use direct React type imports instead of `React.*` namespace types.',
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
