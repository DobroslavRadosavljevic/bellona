# bellona/react rules

Plugin name: `bl-react`. Ids: `bl-react/<slug>`.

**Skip:** test/spec/stories files and `allow` matches. JSX-only rules also require `.tsx` / `.jsx`. `component-props-type` requires `.tsx`. Hook filename rules run on `use-*.ts(x)`.

Primary component = PascalCase name that does **not** end in `Provider` / `Context`. Names that end in `Impl` are primary and are banned. Hook = `use` + PascalCase.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-react/component-file-name-match`

The primary exported component name must match the file basename converted to PascalCase (`user-card.tsx` → `UserCard`).

Skip: tests, `allow`, non-JSX files.

## `bl-react/component-props-type`

When a primary component types its props, that type must be named `{Component}Props` (example: `MetricCard` → `MetricCardProps`).

Skip components with no props parameter and no props type (they do not need `{Name}Props`).

The type must live in the same file. Do not import it. The type must not be empty (`{}` or an empty interface).

The file may declare only that `*Props` type besides the component. Extra aliases and interfaces fail when the component types its props.

Skip: tests, `allow`, non-`.tsx` files. Helpers named `*Provider` / `*Context` are not primary. `*Impl` is not a helper.

Only module-level components count. A function inside any other function (also an anonymous callback such as `items.map(() => …)`) is not checked. Qualified wrapper types work: `const MetricCard: React.FC<MetricCardProps>` reads `MetricCardProps`.

```tsx
type MetricCardProps = {
  title: string
}

function MetricCard(props: MetricCardProps) {
  return null
}
```

## `bl-react/hook-file-name-match`

In `use-*.ts(x)` files, the hook declaration must match the basename (`use-local-storage.ts` → `useLocalStorage`).

## `bl-react/no-forward-ref`

Disallow `forwardRef` from `react` (`forwardRef(…)`, an alias such as `forwardRef as withRef`, `React.forwardRef(…)`, or a namespace import). In React 19 a function component gets `ref` as a normal prop, and React plans to deprecate `forwardRef`.

A `forwardRef` that is not imported from `react` is not checked. Skip: tests, `allow`.

```tsx
// bad
const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => <input ref={ref} {...props} />)

// good
type TextInputProps = ComponentProps<'input'>
function TextInput({ ref, ...props }: TextInputProps) {
  return <input ref={ref} {...props} />
}
```

## `bl-react/no-impl-component-suffix`

Disallow PascalCase component names that contain an `Impl` name segment (`FooImpl`, `FooImplRow`, `FooImplProvider`). `Implementation` does not match.

Prefer: a real name and a file per component.

## `bl-react/no-jsx-iife-in-components`

Disallow IIFEs that return JSX inside components.

Prefer: inline conditional JSX, or extract a component file.

## `bl-react/no-jsx-local-constants-in-components`

Disallow `const node = <div />` inside components.

Prefer: render inline, or extract a component.

## `bl-react/no-jsx-module-constants`

Disallow module-level `const icon = <Svg />`.

Prefer: a component file, then `<Icon />`.

## `bl-react/no-jsx-variable-reassignment-in-components`

Disallow `let ui = …; ui = <Other />` to build JSX.

Prefer: inline conditionals or a child component.

## `bl-react/no-multi-component-files`

One **primary** React component per file. Helpers named `*Provider` / `*Context` are not “primary”. `*Impl` is primary and is also banned by `bl-react/no-impl-component-suffix`.

Only module-level declarations count. A component declared inside an anonymous callback is not a second file-level component.

A wrapper of a component that is declared elsewhere is not a new component: `const RowsMemo = memo(Rows, areEqual)`, `React.memo(Rows)`, `forwardRef(Rows)`. Only the first argument of `memo` / `forwardRef` can define a component, so a comparator function is never counted. An inline `memo(function Rows() {…})` or `memo(() => …)` counts as one component. The same wrapper logic applies to every `bl-react` rule that finds components.

## `bl-react/no-multi-hook-files`

One React hook per `use-*.ts(x)` file.

## `bl-react/no-native-html`

Disallow listed native HTML tags so the app uses design-system components.

**Exceptions:**

- Tags inside a `Typeset` element, or an ancestor with `data-slot="typeset"` / class `typeset` (prose).
- `<input type="hidden">` (a static `"hidden"` value). It has no visible part, so a styled `Input` is the wrong replacement.
- The file that defines the replacement. When the file exports a component with the replacement name for a tag (`replacements[tag].component`, or the default hint below), that tag is allowed. A file that exports `Input` may render `<input>`. A file that exports `TableRow` may render `<tr>`. Other tags in that file are still reported. `export function`, `export const`, `export default function`, and `export { Name }` count.
- Files that match `hostFiles` (path substring or basename, like `allow`).

| Option | Default |
| --- | --- |
| `tags` | high-confidence set below |
| `replacements` | `{}` |
| `hostFiles` | `[]` |

Default `tags`: `button`, `input`, `textarea`, `select`, `option`, `optgroup`, `label`, `img`, `video`, `audio`, `picture`, `source`, `iframe`, `dialog`, `details`, `summary`, `progress`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`, `hr`.

Without a `replacements` entry, the report names the Base UI or shadcn/ui part: `hr` → `Separator`, `details` → `Collapsible`, `summary` → `Collapsible.Trigger`, `option` → `Select.Item`, `optgroup` → `Select.Group`, table tags → `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`. Other tags use the capitalized tag name (`button` → `Button`).

```ts
'bl-react/no-native-html': [
  'error',
  {
    replacements: {
      button: { component: 'Button', from: '@/components/ui/button' },
      input: { component: 'Input', from: '@/components/ui/input' },
    },
  },
],
```

Empty `tags: []` disables the rule for that file set (visitor `before` returns false).

## `bl-react/no-react-namespace`

The old id was `bl-react/no-namespace`. It was renamed because Oxlint has a built-in `react/no-namespace` with a different job (JSX names such as `<svg:circle>`).

Disallow `import React from 'react'`, `import * as React from 'react'`, `React.useState`, and `React.ReactNode` namespace types.

Prefer: `import { useState, type ReactNode } from 'react'`.

Runs on test-skipped TS/TSX (not JSX-only).

## `bl-react/no-render-helper-functions-in-components`

Disallow JSX-returning helper functions **inside** components. Nested non-component functions that return JSX must be components (PascalCase) or extracted files.

```tsx
// bad
function Card() {
  const renderTitle = () => <h1 />;
  return renderTitle();
}

// good
function CardTitle() { return <h1 />; }
function Card() { return <CardTitle />; }
```

## `bl-react/prefer-context-as-provider`

Report `<SomeContext.Provider>` when the object name ends in `Context`. In React 19 a context object is a provider, and React plans to deprecate `<Context.Provider>`.

Also report a `SomeContext.Provider` read outside JSX (`export const ThemeProvider = ThemeContext.Provider`) when `SomeContext` comes from `createContext(…)` / `React.createContext(…)` in the same file, or is imported. Use `ThemeContext` itself.

Components that only end in `Provider` (`Toast.Provider`, `TooltipPrimitive.Provider`, `QueryClientProvider`) are not reported. Skip: tests, `allow`.

```tsx
// bad
<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>

// good
<ThemeContext value={theme}>{children}</ThemeContext>
```

## `bl-react/require-bare-hook-call`

A `useX()` call must be the whole right-hand side, the whole `return` value, or a standalone statement.

```tsx
const tags = useSomethingTags()
return useMemo(() => value, [])
```

Do not write `.prop`, `?.`, `??`, `()`, `as`, or other syntax after the call. Handle null or array on the next lines.

Skip: tests, `allow`. Allowed forms: `const x = useFoo()`, `return useFoo()`, `const useX = () => useFoo()`, `const [a, b] = useState(0)`, `useEffect(() => {}, [])`.
