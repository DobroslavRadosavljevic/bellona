import type { Context } from '@oxlint/plugins';

import { booleanField, objectOptionAt, stringListField } from '../../lib/options.ts';

/**
 * Canonical name: `Dialog.Trigger` and `DialogTrigger` share one key.
 */
export function canonicalComponentName(name: string): string {
  return name.replaceAll('.', '');
}

export function addCanonicalNames(target: Set<string>, name: string): void {
  target.add(name);
  target.add(canonicalComponentName(name));
}

export function nameSetHas(names: ReadonlySet<string>, name: string): boolean {
  return names.has(name) || names.has(canonicalComponentName(name));
}

export function toNameSet(names: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const name of names) {
    addCanonicalNames(set, name);
  }
  return set;
}

function withFlattenedAliases(names: readonly string[]): readonly string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    for (const key of [name, canonicalComponentName(name)]) {
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(key);
    }
  }
  return unique;
}

/**
 * Base UI parts whose `nativeButton` default is `true` (they render `<button>`).
 * Official names are namespaced (`Dialog.Trigger`). Flattened aliases cover wrappers.
 */
const NATIVE_BUTTON_PARTS = [
  'Accordion.Trigger',
  'AlertDialog.Close',
  'AlertDialog.Trigger',
  'Autocomplete.Clear',
  'Autocomplete.Trigger',
  'Button',
  'Combobox.ChipRemove',
  'Combobox.Clear',
  'Combobox.Trigger',
  'Collapsible.Trigger',
  'Dialog.Close',
  'Dialog.Trigger',
  'Drawer.Close',
  'Drawer.Trigger',
  'Menu.Trigger',
  'NavigationMenu.Trigger',
  'NumberField.Decrement',
  'NumberField.Increment',
  'Popover.Close',
  'Popover.Trigger',
  'Select.Trigger',
  'Tabs.Tab',
  'Toast.Action',
  'Toast.Close',
  'Toggle',
  'Toolbar.Button',
] as const;

/**
 * Base UI parts whose `nativeButton` default is `false` (they render `<span>` or `<div>`).
 */
const NON_NATIVE_BUTTON_PARTS = [
  'Autocomplete.Item',
  'Checkbox.Root',
  'Combobox.Item',
  'ContextMenu.CheckboxItem',
  'ContextMenu.Item',
  'ContextMenu.RadioItem',
  'ContextMenu.SubmenuTrigger',
  'Menu.CheckboxItem',
  'Menu.Item',
  'Menu.RadioItem',
  'Menu.SubmenuTrigger',
  'Radio.Root',
  'Select.Item',
  'Switch.Root',
] as const;

export const NATIVE_BUTTON_COMPONENTS: readonly string[] =
  withFlattenedAliases(NATIVE_BUTTON_PARTS);

export const NON_NATIVE_BUTTON_COMPONENTS: readonly string[] =
  withFlattenedAliases(NON_NATIVE_BUTTON_PARTS);

/** Extra `render` hosts that mount a real `<button>` besides native-button parts. */
export const BUTTON_RENDER_HOST_COMPONENTS = ['SidebarMenuButton'] as const;

/**
 * Extra `render` hosts that do not mount a `<button>`.
 * `Link` matches the Base UI tabs-as-links docs example.
 */
export const NON_BUTTON_RENDER_HOST_COMPONENTS = ['Link', 'NavLink'] as const;

export interface RenderHostCatalog {
  buttonNames: ReadonlySet<string>;
  nonButtonNames: ReadonlySet<string>;
}

export interface NativeButtonWithRenderOptions {
  nativeButtonNames: ReadonlySet<string>;
  nonNativeButtonNames: ReadonlySet<string>;
  catalog: RenderHostCatalog;
  requireExplicitWhenUnknown: boolean;
}

export function buildRenderHostCatalog(
  extraButtonHosts: readonly string[] = [],
  extraNonButtonHosts: readonly string[] = [],
): RenderHostCatalog {
  const buttonNames = toNameSet([...NATIVE_BUTTON_COMPONENTS, ...BUTTON_RENDER_HOST_COMPONENTS]);
  const nonButtonNames = toNameSet([
    ...NON_NATIVE_BUTTON_COMPONENTS,
    ...NON_BUTTON_RENDER_HOST_COMPONENTS,
  ]);
  for (const name of extraNonButtonHosts) {
    addCanonicalNames(nonButtonNames, name);
    buttonNames.delete(name);
    buttonNames.delete(canonicalComponentName(name));
  }
  for (const name of extraButtonHosts) {
    addCanonicalNames(buttonNames, name);
    nonButtonNames.delete(name);
    nonButtonNames.delete(canonicalComponentName(name));
  }
  return { buttonNames, nonButtonNames };
}

export function readNativeButtonWithRenderOptions(context: Context): NativeButtonWithRenderOptions {
  const options = objectOptionAt(context, 0);
  const extraButtonHosts = stringListField(options, 'buttonHosts', []);
  const extraNonButtonHosts = stringListField(options, 'nonButtonHosts', []);
  return {
    nativeButtonNames: toNameSet(stringListField(options, 'components', NATIVE_BUTTON_COMPONENTS)),
    nonNativeButtonNames: toNameSet(
      stringListField(options, 'nonNativeButtonComponents', NON_NATIVE_BUTTON_COMPONENTS),
    ),
    catalog: buildRenderHostCatalog(extraButtonHosts, extraNonButtonHosts),
    requireExplicitWhenUnknown: booleanField(options, 'requireExplicitWhenUnknown', false),
  };
}
