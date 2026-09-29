import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { startsWithUtilityPrefix, utilityBodyOf } from '../class-name.ts';
import {
  CLASS_POSITION_OPTION_SCHEMA,
  DEFAULT_CLASS_ATTRIBUTES,
  DEFAULT_CLASS_CALLEES,
  DEFAULT_CLASS_POSITION_OPTIONS,
  walkClassAttribute,
  walkClassCall,
  type ClassPositionVisitor,
} from '../class-position.ts';
import { readClassAttributes, readClassCallees, shouldSkipTailwindFile } from '../options.ts';

export const noDynamicClassConstructionName = bnRuleName('no-dynamic-class-construction');

/**
 * The class fragment just before `${…}`: `"flex bg-"` → `bg-`. Returns the
 * utility family when the fragment is a known prefix plus `-` or `-[`.
 */
function partialUtilityBefore(text: string): string | undefined {
  if (text === '' || /\s$/u.test(text)) {
    return undefined;
  }
  const fragment = text.split(/\s+/u).at(-1) ?? '';
  const body = utilityBodyOf(fragment);
  const match = /^(.+?)-\[?$/u.exec(body);
  if (match === null) {
    return undefined;
  }
  const family = match[1] ?? '';
  return startsWithUtilityPrefix(family) ? fragment : undefined;
}

export const noDynamicClassConstruction: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Tailwind class names built from parts at runtime (`bg-${hue}-500`) in class positions',
    },
    messages: {
      dynamic: agentDiagnostic({
        problem:
          'This class name is built at runtime from `{{fragment}}` plus a value (for example `bg-${hue}-500`).',
        why: 'Tailwind reads source files as plain text and makes CSS only for complete class names. A class that exists only at runtime gets no CSS.',
        fix: 'Map each value to a complete class name (`{ red: "bg-red-500", blue: "bg-blue-500" }`), or use a `tv` variant. For a free value, set a CSS variable in `style` and use `bg-(--hue)`.',
        avoid:
          'Do not add a safelist comment to hide the problem. Do not build the name with `+` instead of a template. Do not disable the rule.',
      }),
    },
    schema: [CLASS_POSITION_OPTION_SCHEMA],
    defaultOptions: DEFAULT_CLASS_POSITION_OPTIONS,
  },
  createOnce(context) {
    let attributes: readonly string[] = DEFAULT_CLASS_ATTRIBUTES;
    let callees: readonly string[] = DEFAULT_CLASS_CALLEES;

    const checkTemplate = (node: ESTree.TemplateLiteral) => {
      for (let index = 0; index < node.expressions.length; index += 1) {
        const quasi = node.quasis[index];
        if (quasi === undefined) {
          continue;
        }
        const fragment = partialUtilityBefore(quasi.value.cooked ?? quasi.value.raw);
        if (fragment === undefined) {
          continue;
        }
        context.report({ node, messageId: 'dynamic', data: { fragment } });
        return;
      }
    };

    const visitor: ClassPositionVisitor = {
      string() {},
      template: checkTemplate,
    };

    return {
      before() {
        if (shouldSkipTailwindFile(context)) {
          return false;
        }
        attributes = readClassAttributes(context, DEFAULT_CLASS_ATTRIBUTES);
        callees = readClassCallees(context, DEFAULT_CLASS_CALLEES);
      },
      JSXAttribute(node) {
        walkClassAttribute(node, attributes, visitor);
      },
      CallExpression(node) {
        walkClassCall(node, callees, visitor);
      },
    };
  },
});
