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

## `bl-react/no-multi-hook-files`

One React hook per `use-*.ts(x)` file.

## `bl-react/no-native-html`

Disallow listed native HTML tags so the app uses design-system components.

**Exception:** tags inside a `Typeset` element, or an ancestor with `data-slot="typeset"` / class `typeset` (prose).

| Option | Default |
| --- | --- |
| `tags` | high-confidence set below |
| `replacements` | `{}` |

Default `tags`: `button`, `input`, `textarea`, `select`, `option`, `optgroup`, `label`, `img`, `video`, `audio`, `picture`, `source`, `iframe`, `dialog`, `details`, `summary`, `progress`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`, `hr`.

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

## `bl-react/no-namespace`

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

## `bl-react/require-bare-hook-call`

A `useX()` call must be the whole right-hand side, the whole `return` value, or a standalone statement.

```tsx
const tags = useSomethingTags()
return useMemo(() => value, [])
```

Do not write `.prop`, `?.`, `??`, `()`, `as`, or other syntax after the call. Handle null or array on the next lines.

Skip: tests, `allow`. Allowed forms: `const x = useFoo()`, `return useFoo()`, `const useX = () => useFoo()`, `const [a, b] = useState(0)`, `useEffect(() => {}, [])`.
