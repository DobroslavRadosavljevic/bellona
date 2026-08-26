import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { readNativeHtmlReplacements } from '../options.ts';

export const HIGH_CONFIDENCE_TAGS = [
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'optgroup',
  'label',
  'img',
  'video',
  'audio',
  'picture',
  'source',
  'iframe',
  'dialog',
  'details',
  'summary',
  'progress',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'hr',
] as const;

function getJsxAttributeName(
  attribute: ESTree.JSXAttribute | ESTree.JSXSpreadAttribute,
): string | undefined {
  if (attribute.type !== 'JSXAttribute') {
    return undefined;
  }
  if (attribute.name.type === 'JSXIdentifier') {
    return attribute.name.name;
  }
  return undefined;
}

function getStaticJsxAttributeString(
  attribute: ESTree.JSXAttribute | ESTree.JSXSpreadAttribute,
): string | undefined {
  if (
    attribute.type !== 'JSXAttribute' ||
    attribute.value === null ||
    attribute.value === undefined
  ) {
    return undefined;
  }
  if (attribute.value.type === 'Literal' && isJsString(attribute.value.value)) {
    return attribute.value.value;
  }
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression.type === 'Literal' &&
    isJsString(attribute.value.expression.value)
  ) {
    return attribute.value.expression.value;
  }
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression.type === 'TemplateLiteral' &&
    attribute.value.expression.expressions.length === 0 &&
    attribute.value.expression.quasis.length === 1
  ) {
    return attribute.value.expression.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function openingElementIsTypeset(opening: ESTree.JSXOpeningElement): boolean {
  if (opening.name.type === 'JSXIdentifier' && opening.name.name === 'Typeset') {
    return true;
  }

  for (const attribute of opening.attributes) {
    const name = getJsxAttributeName(attribute);
    const value = getStaticJsxAttributeString(attribute);
    if (value === undefined) {
      continue;
    }
    if (name === 'data-slot' && value === 'typeset') {
      return true;
    }
    if (name === 'className') {
      const classes = value.split(/\s+/u);
      if (classes.includes('typeset')) {
        return true;
      }
    }
  }

  return false;
}

function isInsideTypeset(node: ESTree.Node): boolean {
  let current: ESTree.Node | undefined = node.parent ?? undefined;
  while (current) {
    if (current.type === 'JSXElement' && openingElementIsTypeset(current.openingElement)) {
      return true;
    }
    current = current.parent ?? undefined;
  }
  return false;
}

function suggestComponent(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export const noNativeHtmlName = bnRuleName('no-native-html');

export const noNativeHtml: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow high-confidence native HTML tags so callers use design-system components',
    },
    messages: {
      forbidden: agentDiagnostic({
        problem:
          'Native HTML `<{{tag}}>` is not allowed by `bl-react/no-native-html`. Use the design-system component `<{{component}}>` instead. Tags inside `Typeset` or an ancestor with `data-slot="typeset"` / class `typeset` are allowed (prose).',
        why: 'Native tags skip the shared visual and a11y contract. The app then has two button/input implementations.',
        fix: 'Replace `<{{tag}}>` with `<{{component}}>` and map props to that component’s API. Configure `{ replacements: { {{tag}}: { component: "…", from: "…" } } }` so the import path is known.',
        avoid:
          'Do not wrap the native tag in a local component with the same native tag inside. Do not disable the rule for convenience. Empty `tags: []` turns the rule off for that override — only do that when the file set is not UI.',
      }),
      forbiddenFrom: agentDiagnostic({
        problem:
          'Native HTML `<{{tag}}>` is not allowed. Use `<{{component}}>` from "{{from}}" instead. Typeset/prose exceptions still apply.',
        why: 'The project named a replacement component and import path. Native `<{{tag}}>` bypasses it.',
        fix: 'Import `{ {{component}} }` from "{{from}}" and render `<{{component}} …>` with the design-system props. Remove the native `<{{tag}}>`.',
        avoid:
          'Do not keep `<{{tag}}>` next to the design-system component. Do not invent a second wrapper. Do not disable the rule.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
          replacements: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: false,
              required: ['component', 'from'],
              properties: {
                component: { type: 'string', minLength: 1 },
                from: { type: 'string', minLength: 1 },
              },
            },
          },
        },
      },
    ],
    defaultOptions: [{ tags: [...HIGH_CONFIDENCE_TAGS], replacements: {} }],
  },
  createOnce(context) {
    let banned = new Set<string>();
    let replacements = new Map<string, { component: string; from: string }>();

    return {
      before() {
        const tags = stringListField(objectOptionAt(context, 0), 'tags', HIGH_CONFIDENCE_TAGS);
        banned = new Set([...tags].map((tag) => tag.toLowerCase()));
        replacements = new Map(
          [...readNativeHtmlReplacements(context)].map(([tag, hint]) => [tag.toLowerCase(), hint]),
        );
        if (banned.size === 0) {
          return false;
        }
      },
      JSXOpeningElement(node) {
        const { name } = node;
        if (name.type !== 'JSXIdentifier') {
          return;
        }

        const tag = name.name;
        if (tag !== tag.toLowerCase()) {
          return;
        }

        if (!banned.has(tag)) {
          return;
        }

        if (isInsideTypeset(node)) {
          return;
        }

        const hint = replacements.get(tag);
        if (hint !== undefined) {
          context.report({
            messageId: 'forbiddenFrom',
            data: { tag, component: hint.component, from: hint.from },
            node: name,
          });
          return;
        }

        context.report({
          messageId: 'forbidden',
          data: { tag, component: suggestComponent(tag) },
          node: name,
        });
      },
    };
  },
});
