# bellona/base-ui rules

Plugin name: `bl-base-ui`. Ids: `bl-base-ui/<slug>`.

**No** `@base-ui/react` import required. Matching is by JSX name. `Dialog.Trigger` and `DialogTrigger` are the same canonical name (dots stripped).

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-base-ui/no-component-as-render`

Disallow a component reference as a `render` value: `render={Link}` or `render={Router.Link}` (a PascalCase name). Base UI calls `render` as a plain function, not as a component, so hooks in it can break the Rules of Hooks. Base UI warns about this in development.

Pass an element or a render function:

```tsx
<Menu.Item render={<Link to="/x" />}>Go</Menu.Item>
<Menu.Item render={(props) => <Link {...props} to="/x" />}>Go</Menu.Item>
```

The rule checks every non-DOM JSX element with a `render` prop. It skips a name bound in the same file to a JSX element (`const LinkElement = <Link />`), and test files.

| Option | Role |
| --- | --- |
| `allow` | Path substring / basename skip |
| `ignore` | JSX element names whose `render` prop is not a Base UI `render` prop (for example a router `Route`) |

## `bl-base-ui/require-native-button-with-render`

Align Base UI `nativeButton` with whether `render` mounts a real `<button>`. Base UI warns when they disagree.

When `render` is present:

| Host kind | Required `nativeButton` |
| --- | --- |
| mounts `<button>` (or a known button host) | `nativeButton` true: omit it on a native-button part, set `nativeButton` on a non-native part (`Menu.Item`) |
| mounts a non-button (`<div>`, `<span>`, `<a>`, fragment, `Link`, …) | `nativeButton={false}` (or omit it on a non-native part) |
| mounts a `<button>` in one branch and a non-button in another | `nativeButton` from the same condition (`nativeButton={!isLink}`) |
| unknown host | silence unless `requireExplicitWhenUnknown: true` |

Dynamic `nativeButton={expr}` is left alone.

A falsy `render` (`show && <Link />`, `cond ? <a /> : undefined`) makes Base UI render the default element of the part. So `<Button render={show && <Link />}>` is mixed: `<a>` or `<button>`. Base UI warns in both directions: a non-button with `nativeButton` true, and a `<button>` with `nativeButton` false.

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

Host classification also understands function `render={() => <button />}`, conditionals, and logical expressions. A fragment host is non-button. Button and non-button branches together are mixed and report `requireDynamic`. A branch with an unknown host makes the whole value unknown.

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
