import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  classifyRenderHost,
  defaultNativeButton,
  getJsxAttrValue,
  getJsxName,
  getNativeButtonLiteral,
  jsxHasAttr,
} from '../hosts.ts';
import {
  BUTTON_RENDER_HOST_COMPONENTS,
  NATIVE_BUTTON_COMPONENTS,
  NON_BUTTON_RENDER_HOST_COMPONENTS,
  NON_NATIVE_BUTTON_COMPONENTS,
  readNativeButtonWithRenderOptions,
  type NativeButtonWithRenderOptions,
} from '../options.ts';

export const requireNativeButtonWithRenderName = bnRuleName(
  'base-ui',
  'require-native-button-with-render',
);

const STRING_NAME_LIST_SCHEMA = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  uniqueItems: true,
} as const;

export const requireNativeButtonWithRender: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Align Base UI `nativeButton` with whether `render` mounts a real `<button>` DOM node. Matching is by JSX name so design-system wrappers are covered without an `@base-ui/react` import.',
    },
    messages: {
      requireFalse:
        '`<{{component}}>` `render` mounts a non-`<button>` host. Set `nativeButton={false}`. Base UI warns when `nativeButton` disagrees with the DOM node.',
      requireTrue:
        '`<{{component}}>` `render` mounts a `<button>` host. Set `nativeButton` or `nativeButton={true}`. Base UI warns when `nativeButton` disagrees with the DOM node.',
      requireExplicit:
        '`<{{component}}>` uses `render` with an unknown host. Set `nativeButton={false}` for non-button hosts, or omit/`nativeButton={true}` when the host mounts a real `<button>`.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          components: STRING_NAME_LIST_SCHEMA,
          nonNativeButtonComponents: STRING_NAME_LIST_SCHEMA,
          buttonHosts: STRING_NAME_LIST_SCHEMA,
          nonButtonHosts: STRING_NAME_LIST_SCHEMA,
          requireExplicitWhenUnknown: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [
      {
        components: [...NATIVE_BUTTON_COMPONENTS],
        nonNativeButtonComponents: [...NON_NATIVE_BUTTON_COMPONENTS],
        buttonHosts: [...BUTTON_RENDER_HOST_COMPONENTS],
        nonButtonHosts: [...NON_BUTTON_RENDER_HOST_COMPONENTS],
        requireExplicitWhenUnknown: false,
      },
    ],
  },
  createOnce(context) {
    let options: NativeButtonWithRenderOptions | undefined;

    return {
      before() {
        options = readNativeButtonWithRenderOptions(context);
        if (options.nativeButtonNames.size === 0 && options.nonNativeButtonNames.size === 0) {
          return false;
        }
      },
      JSXOpeningElement(node) {
        const current = options;
        if (current === undefined) {
          return;
        }
        const name = getJsxName(node);
        if (name === undefined) {
          return;
        }
        const defaultNative = defaultNativeButton(
          name,
          current.nativeButtonNames,
          current.nonNativeButtonNames,
        );
        if (defaultNative === undefined) {
          return;
        }
        if (!jsxHasAttr(node, 'render')) {
          return;
        }

        const nativeButton = getNativeButtonLiteral(node);
        if (nativeButton === 'dynamic') {
          return;
        }

        const hostKind = classifyRenderHost(getJsxAttrValue(node, 'render'), current.catalog);

        if (hostKind === 'non-button') {
          if (nativeButton === false || (nativeButton === undefined && defaultNative === false)) {
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
          if (nativeButton === true || (nativeButton === undefined && defaultNative === true)) {
            return;
          }
          context.report({
            messageId: 'requireTrue',
            data: { component: name },
            node: node.name,
          });
          return;
        }

        if (!current.requireExplicitWhenUnknown) {
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
