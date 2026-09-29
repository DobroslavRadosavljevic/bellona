import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { splitClassTokens, utilityBodyOf } from '../class-name.ts';
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

export const noV3ArbitraryVarName = bnRuleName('no-v3-arbitrary-var');

/**
 * `bg-[--brand]` is the v3 short form of `bg-[var(--brand)]`. Tailwind 4.3.3
 * copies the bracket text as is and writes `background-color: --brand`, which is
 * not valid CSS. The v4 short form is `bg-(--brand)`.
 * @see https://tailwindcss.com/docs/upgrade-guide#using-variables-in-arbitrary-values
 */
const ARBITRARY_VAR_PATTERN = /-\[((?:[a-z-]+:)?--[A-Za-z0-9_-]+)\]$/u;

/**
 * v3 opacity utilities. Tailwind 4.3.3 makes no CSS for them.
 * @see https://tailwindcss.com/docs/upgrade-guide#removed-deprecated-utilities
 */
const REMOVED_OPACITY_PATTERN = /^(bg|text|border|divide|ring|placeholder)-opacity(?:-|$)/u;

/**
 * v3 names that Tailwind 4.3.3 still compiles, but that the v4 docs replace.
 * `shadow-sm` and other renamed names are valid v4 classes, so they are not here.
 * @see https://tailwindcss.com/docs/upgrade-guide#removed-deprecated-utilities
 */
function deprecatedReplacement(body: string): string | undefined {
  const flex = /^flex-(shrink|grow)(-.+)?$/u.exec(body);
  if (flex !== null) {
    return `${flex[1] ?? ''}${flex[2] ?? ''}`;
  }
  switch (body) {
    case 'overflow-ellipsis':
      return 'text-ellipsis';
    case 'decoration-slice':
      return 'box-decoration-slice';
    case 'decoration-clone':
      return 'box-decoration-clone';
    default:
      return undefined;
  }
}

function replaceLast(text: string, search: string, replacement: string): string {
  const index = text.lastIndexOf(search);
  if (index === -1) {
    return text;
  }
  return `${text.slice(0, index)}${replacement}${text.slice(index + search.length)}`;
}

interface TokenReport {
  messageId: 'arbitraryVar' | 'removedOpacity' | 'deprecatedUtility';
  data: Record<string, string>;
}

function checkToken(token: string): TokenReport | undefined {
  const body = utilityBodyOf(token);
  const variable = ARBITRARY_VAR_PATTERN.exec(body);
  if (variable !== null) {
    const inner = variable[1] ?? '';
    return {
      messageId: 'arbitraryVar',
      data: { token, fix: replaceLast(token, `[${inner}]`, `(${inner})`) },
    };
  }
  const opacity = REMOVED_OPACITY_PATTERN.exec(body);
  if (opacity !== null) {
    return { messageId: 'removedOpacity', data: { token, family: opacity[1] ?? '' } };
  }
  const replacement = deprecatedReplacement(body);
  if (replacement !== undefined) {
    return {
      messageId: 'deprecatedUtility',
      data: { token, fix: replaceLast(token, body, replacement) },
    };
  }
  return undefined;
}

export const noV3ArbitraryVar: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Tailwind v3 class syntax in class positions: `x-[--var]` and removed or deprecated v3 utilities',
    },
    messages: {
      arbitraryVar: agentDiagnostic({
        problem:
          'Class `{{token}}` uses the Tailwind v3 short form for a CSS variable (`x-[--var]`).',
        why: 'Tailwind v4 copies the bracket text as is. `bg-[--brand]` makes `background-color: --brand`, which is not valid CSS, so the style does not apply.',
        fix: 'Write `{{fix}}`. The v4 short form for a CSS variable uses parentheses. `x-[var(--var)]` also works.',
        avoid:
          'Do not keep the bracket form with `var()` removed. Do not move the value to inline `style` only to silence this. Do not disable the rule.',
      }),
      removedOpacity: agentDiagnostic({
        problem: 'Class `{{token}}` is a Tailwind v3 opacity utility. Tailwind v4 removed it.',
        why: 'Tailwind v4 makes no CSS for `{{family}}-opacity-*`, so the class does nothing.',
        fix: 'Put the opacity on the color with a modifier: `{{family}}-black/50` instead of `{{family}}-black {{family}}-opacity-50`. Remove `{{token}}`.',
        avoid:
          'Do not replace it with the `opacity-*` utility unless the whole element must fade. Do not disable the rule.',
      }),
      deprecatedUtility: agentDiagnostic({
        problem: 'Class `{{token}}` is a Tailwind v3 name. The v4 name is `{{fix}}`.',
        why: 'Tailwind v4 keeps the v3 name only for compatibility. The v4 docs and the upgrade tool use the new name, so one class then has two spellings.',
        fix: 'Write `{{fix}}`.',
        avoid: 'Do not keep both spellings in the code base. Do not disable the rule.',
      }),
    },
    schema: [CLASS_POSITION_OPTION_SCHEMA],
    defaultOptions: DEFAULT_CLASS_POSITION_OPTIONS,
  },
  createOnce(context) {
    let attributes: readonly string[] = DEFAULT_CLASS_ATTRIBUTES;
    let callees: readonly string[] = DEFAULT_CLASS_CALLEES;

    const checkText = (node: ESTree.Node, text: string) => {
      for (const token of splitClassTokens(text)) {
        const report = checkToken(token);
        if (report !== undefined) {
          context.report({ node, messageId: report.messageId, data: report.data });
        }
      }
    };

    const visitor: ClassPositionVisitor = {
      string: checkText,
      template(node) {
        for (const quasi of node.quasis) {
          checkText(quasi, quasi.value.cooked ?? quasi.value.raw);
        }
      },
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
