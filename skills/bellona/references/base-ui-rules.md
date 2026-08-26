# bellona/base-ui rules

Plugin name: `bl-base-ui`. Ids: `bl-base-ui/<slug>`.

**No** `@base-ui/react` import required. Matching is by JSX name. `Dialog.Trigger` and `DialogTrigger` are the same canonical name (dots stripped).

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-base-ui/require-native-button-with-render`

Align Base UI `nativeButton` with whether `render` mounts a real `<button>`. Base UI warns when they disagree.

When `render` is present:

| Host kind | Required `nativeButton` |
| --- | --- |
| mounts `<button>` (or a known button host) | omit or `nativeButton={true}` |
| mounts a non-button (`<div>`, `<span>`, `<a>`, fragment, `Link`, …) | `nativeButton={false}` |
| unknown host | silence unless `requireExplicitWhenUnknown: true` |

Dynamic `nativeButton={expr}` is left alone.

### Options

| Option | Role |
| --- | --- |
| `components` | **Replaces** the default native-button part list (`nativeButton` default true) |
| `nonNativeButtonComponents` | **Replaces** the default non-native part list (default false) |
| `buttonHosts` | **Adds** extra `render` hosts treated as buttons |
| `nonButtonHosts` | **Adds** extra `render` hosts treated as non-buttons (also wins over button names) |
| `requireExplicitWhenUnknown` | default `false` |

Default extra hosts: button `SidebarMenuButton`; non-button `Link`, `NavLink`.

If both component lists are empty, the rule disables itself.

### Default native-button parts (`nativeButton` default true)

`Accordion.Trigger`, `AlertDialog.Close`, `AlertDialog.Trigger`, `Autocomplete.Clear`, `Autocomplete.Trigger`, `Button`, `Combobox.ChipRemove`, `Combobox.Clear`, `Combobox.Trigger`, `Collapsible.Trigger`, `Dialog.Close`, `Dialog.Trigger`, `Drawer.Close`, `Drawer.Trigger`, `Menu.Trigger`, `NavigationMenu.Trigger`, `NumberField.Decrement`, `NumberField.Increment`, `Popover.Close`, `Popover.Trigger`, `Select.Trigger`, `Tabs.Tab`, `Toast.Action`, `Toast.Close`, `Toggle`, `Toolbar.Button`.

### Default non-native parts (`nativeButton` default false)

`Autocomplete.Item`, `Checkbox.Root`, `Combobox.Item`, `ContextMenu.CheckboxItem`, `ContextMenu.Item`, `ContextMenu.RadioItem`, `ContextMenu.SubmenuTrigger`, `Menu.CheckboxItem`, `Menu.Item`, `Menu.RadioItem`, `Menu.SubmenuTrigger`, `Radio.Root`, `Select.Item`, `Switch.Root`.

### Prefer

```tsx
<Dialog.Trigger render={<Link to="/x" />} nativeButton={false}>
  Open
</Dialog.Trigger>

<Menu.Item render={<button type="button" />} nativeButton>
  Action
</Menu.Item>
```

Host classification also understands function `render={() => <button />}`, conditionals, and logical expressions. A fragment host is non-button. Mixed button/non-button branches count as non-button if any branch is.

```ts
'bl-base-ui/require-native-button-with-render': [
  'error',
  {
    buttonHosts: ['AppButton'],
    nonButtonHosts: ['RouterLink'],
    requireExplicitWhenUnknown: true,
  },
],
```
