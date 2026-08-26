import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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

export const requireNativeButtonWithRenderName = bnRuleName('require-native-button-with-render');

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
      requireFalse: agentDiagnostic({
        problem:
          '`<{{component}}>` uses `render` to mount a host that is not a real `<button>` (div/span/a/fragment/`Link`/…). `nativeButton` is missing or true.',
        why: 'Base UI warns when `nativeButton` disagrees with the DOM node. A non-button host with `nativeButton` default true is invalid.',
        fix: 'Set `nativeButton={false}` on `<{{component}}>`. Keep the `render` host. Example: `<Dialog.Trigger render={<Link to="/x" />} nativeButton={false}>`.',
        avoid:
          'Do not remove `render` only to silence this. Do not set `nativeButton={true}` on a non-button host. Do not disable the rule.',
      }),
      requireTrue: agentDiagnostic({
        problem:
          '`<{{component}}>` uses `render` to mount a real `<button>` host, but `nativeButton={false}` is set.',
        why: 'A button host must use the native button semantics (`nativeButton` omitted or true). False lies about the DOM node.',
        fix: 'Remove `nativeButton={false}`, or set `nativeButton={true}` / `nativeButton`. Keep the `<button>` host in `render`.',
        avoid:
          'Do not change the host to a `div` to match `nativeButton={false}` unless that is the real design. Do not disable the rule.',
      }),
      requireExplicit: agentDiagnostic({
        problem:
          '`<{{component}}>` uses `render` with an unknown host, and `requireExplicitWhenUnknown` is on. `nativeButton` must be stated.',
        why: 'An unknown host cannot be classified. Base UI still needs an explicit `nativeButton` so the DOM contract is not guessed.',
        fix: 'If the host is a real `<button>`, omit `nativeButton` or set `nativeButton={true}`. If it is not a button, set `nativeButton={false}`. You can teach extra hosts with `{ buttonHosts, nonButtonHosts }`.',
        avoid: 'Do not set a random boolean. Match the actual DOM node. Do not disable the rule.',
      }),
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
