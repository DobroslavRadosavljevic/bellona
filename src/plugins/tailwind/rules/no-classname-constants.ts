import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { bindingName } from '../ast.ts';
import { isClassNameBinding, looksLikeClassNameList } from '../class-name.ts';
import { collectClassNameText } from '../collect.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOWED_CALLEES,
  DEFAULT_MIN_UTILITIES,
  DEFAULT_TAILWIND_OPTIONS,
  readAllowedCallees,
  readMinUtilities,
  shouldSkipTailwindFile,
} from '../options.ts';

export const noClassnameConstantsName = bnRuleName('no-classname-constants');

export const noClassnameConstants: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow storing Tailwind class names in constants. Use tailwind-variants or a reusable component.',
    },
    messages: {
      storedClassNames:
        'Do not store class names in "{{name}}". Use tailwind-variants or a reusable component.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_TAILWIND_OPTIONS,
  },
  createOnce(context) {
    let allowedCallees: readonly string[] = DEFAULT_ALLOWED_CALLEES;
    let minUtilities = DEFAULT_MIN_UTILITIES;

    const reportIfClassNameConstant = (name: string | undefined, init: ESTree.Node) => {
      const parts: string[] = [];
      collectClassNameText(init, allowedCallees, parts);
      const text = parts.join(' ');
      const nameHint = name !== undefined && isClassNameBinding(name);
      if (!looksLikeClassNameList(text, minUtilities, nameHint)) {
        return;
      }
      context.report({
        node: init,
        messageId: 'storedClassNames',
        data: { name: name ?? 'this constant' },
      });
    };

    return {
      before() {
        if (shouldSkipTailwindFile(context)) {
          return false;
        }
        allowedCallees = readAllowedCallees(context);
        minUtilities = readMinUtilities(context);
      },
      VariableDeclarator(node) {
        if (node.init === null || node.init === undefined) {
          return;
        }
        reportIfClassNameConstant(bindingName(node.id), node.init);
      },
      PropertyDefinition(node) {
        if (node.value === null || node.value === undefined) {
          return;
        }
        reportIfClassNameConstant(bindingName(node.key), node.value);
      },
    };
  },
});
