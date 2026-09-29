import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { bindingName, isInsideFunction } from '../ast.ts';
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
      storedClassNames: agentDiagnostic({
        problem:
          'Tailwind class names are stored in "{{name}}" (`const` / `let` / `var` or a class field). Strings inside `tv(...)` / `createTV(...)` (or `allowedCallees`) are not this rule.',
        why: 'A module-level class-name constant is a second styling API next to the components. Other code imports and mixes it, so its classes drift from the component variants and from `cn()` merges.',
        fix: 'Put the classes in a `tv` / `createTV` recipe (`const control = tv({ base: "…" })`) or inline `className` on a reusable component. Add other recipe helpers via `{ allowedCallees: ["tv", "createTV", "cva"] }`.',
        avoid:
          'Do not move the string into a function that still returns the same constant. Do not prefix the name to dodge detection. Do not disable the rule.',
      }),
      localClassNames: agentDiagnostic({
        problem:
          'Tailwind class names are stored in the local variable "{{name}}" inside a function. Strings inside `tv(...)` / `createTV(...)` (or `allowedCallees`) are not this rule.',
        why: 'The classes then live away from the element that uses them. A reader must find the variable to see the styles, and states such as `active` get their classes in a second place.',
        fix: 'Write the classes on the element: `className={cn("flex …", active && "…")}`. If the classes have variants or states, move them into a `tv` recipe and call it in `className`.',
        avoid:
          'Do not move the variable to module level (also reported). Do not prefix the name to dodge detection. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_TAILWIND_OPTIONS,
  },
  createOnce(context) {
    let allowedCallees: readonly string[] = DEFAULT_ALLOWED_CALLEES;
    let minUtilities = DEFAULT_MIN_UTILITIES;

    const reportIfClassNameConstant = (
      name: string | undefined,
      init: ESTree.Node,
      local: boolean,
    ) => {
      const parts: string[] = [];
      collectClassNameText(init, allowedCallees, parts);
      const text = parts.join(' ');
      const nameHint = name !== undefined && isClassNameBinding(name);
      if (!looksLikeClassNameList(text, minUtilities, nameHint)) {
        return;
      }
      context.report({
        node: init,
        messageId: local ? 'localClassNames' : 'storedClassNames',
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
        reportIfClassNameConstant(bindingName(node.id), node.init, isInsideFunction(node));
      },
      PropertyDefinition(node) {
        if (node.value === null || node.value === undefined) {
          return;
        }
        reportIfClassNameConstant(bindingName(node.key), node.value, false);
      },
    };
  },
});
