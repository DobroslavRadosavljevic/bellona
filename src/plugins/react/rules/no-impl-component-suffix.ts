import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapComponentInit } from '../ast.ts';
import { isImplComponentName } from '../filename.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipJsxFile } from '../options.ts';

export const noImplComponentSuffixName = bnRuleName('no-impl-component-suffix');

export const noImplComponentSuffix: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow PascalCase React component names that contain an Impl name segment',
    },
    messages: {
      implSuffix: agentDiagnostic({
        problem:
          'Component `{{name}}` uses an `Impl` name segment. That segment is not allowed on React components.',
        why: 'Agents rename extra components to `*Impl` (or `*ImplProvider`) to hide them from one-component-per-file. The segment is a dodge, not a real type.',
        fix: 'Give the component a real name without `Impl`, put it in its own file, and render it from the parent. Do not keep a second component in this file.',
        avoid:
          'Do not use `Impl`, `impl`, `*ImplProvider`, or a typo of that segment. Do not nest the extra component inside the parent. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const report = (node: ESTree.Node, name: string | undefined) => {
      if (!isImplComponentName(name)) {
        return;
      }
      context.report({ messageId: 'implSuffix', node, data: { name } });
    };

    return {
      before() {
        if (shouldSkipJsxFile(context)) {
          return false;
        }
      },
      FunctionDeclaration(node) {
        report(node.id ?? node, node.id?.name);
      },
      FunctionExpression(node) {
        if (node.id === undefined || node.id === null) {
          return;
        }
        const parent = node.parent ?? undefined;
        if (parent?.type === 'VariableDeclarator') {
          return;
        }
        report(node.id, node.id.name);
      },
      VariableDeclarator(node) {
        if (unwrapComponentInit(node.init) === undefined || node.id.type !== 'Identifier') {
          return;
        }
        report(node.id, node.id.name);
      },
    };
  },
});
