import type { CreateOnceRule } from '@oxlint/plugins';

import { booleanField, objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import {
  NATIVE_BUTTON_DEFAULT_COMPONENTS,
  classifyRenderHost,
  getJsxAttrValue,
  getJsxName,
  getNativeButtonLiteral,
  jsxHasAttr,
} from '../hosts.ts';

export const requireNativeButtonWithRenderName = vmRuleName('require-native-button-with-render');

export const requireNativeButtonWithRender: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Align Base UI `nativeButton` with whether `render` mounts a real `<button>` DOM node',
    },
    messages: {
      requireFalse:
        '`<{{component}}>` defaults to a native button. Set `nativeButton={false}` when `render` mounts a non-`<button>` (for example `<Link>`, `<a>`, or `<div>`). Keep the default when composing `render={<Button />}`.',
      requireTrue:
        '`<{{component}}>` has `nativeButton={false}` but `render` mounts a `<button>` (or `<Button>`). Remove `nativeButton={false}` or set `nativeButton` / `nativeButton={true}`. Base UI warns when the prop disagrees with the DOM node.',
      requireExplicit:
        '`<{{component}}>` uses `render` with an unknown host. Set `nativeButton={false}` for non-button hosts, or omit/`nativeButton={true}` when the host mounts a real `<button>`.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          components: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
          requireExplicitWhenUnknown: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [
      {
        components: [...NATIVE_BUTTON_DEFAULT_COMPONENTS],
        requireExplicitWhenUnknown: false,
      },
    ],
  },
  createOnce(context) {
    let components = new Set<string>(NATIVE_BUTTON_DEFAULT_COMPONENTS);
    let requireExplicitWhenUnknown = false;

    return {
      before() {
        const options = objectOptionAt(context, 0);
        components = new Set(
          stringListField(options, 'components', NATIVE_BUTTON_DEFAULT_COMPONENTS),
        );
        requireExplicitWhenUnknown = booleanField(options, 'requireExplicitWhenUnknown', false);
        if (components.size === 0) {
          return false;
        }
      },
      JSXOpeningElement(node) {
        const name = getJsxName(node);
        if (name === undefined || !components.has(name)) {
          return;
        }
        if (!jsxHasAttr(node, 'render')) {
          return;
        }

        const nativeButton = getNativeButtonLiteral(node);
        const renderValue = getJsxAttrValue(node, 'render');
        const hostKind = classifyRenderHost(renderValue);

        if (hostKind === 'non-button') {
          if (nativeButton === false) {
            return;
          }
          context.report({
            messageId: 'requireFalse',
            data: { component: name },
            node: node.name,
          });
          return;
        }

        if (hostKind === 'button') {
          if (nativeButton === false) {
            context.report({
              messageId: 'requireTrue',
              data: { component: name },
              node: node.name,
            });
          }
          return;
        }

        if (!requireExplicitWhenUnknown) {
          return;
        }
        if (nativeButton !== undefined) {
          return;
        }
        context.report({
          messageId: 'requireExplicit',
          data: { component: name },
          node: node.name,
        });
      },
    };
  },
});
