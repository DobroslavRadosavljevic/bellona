# bellona/react rules

Plugin name: `bellona`. Ids: `bellona/react-<slug>`.

**Skip:** test/spec/stories files and `allow` matches. JSX-only rules also require `.tsx` / `.jsx`. Hook filename rules run on `use-*.ts(x)`.

Primary component = PascalCase name that does **not** end in `Impl` / `Provider` / `Context`. Hook = `use` + PascalCase.

## `bellona/react-component-file-name-match`

The primary exported component name must match the file basename converted to PascalCase (`user-card.tsx` → `UserCard`).

Skip: tests, `allow`, non-JSX files.

## `bellona/react-hook-file-name-match`

In `use-*.ts(x)` files, the hook declaration must match the basename (`use-local-storage.ts` → `useLocalStorage`).

## `bellona/react-no-jsx-iife-in-components`

Disallow IIFEs that return JSX inside components.

Prefer: inline conditional JSX, or extract a component file.

## `bellona/react-no-jsx-local-constants-in-components`

Disallow `const node = <div />` inside components.

Prefer: render inline, or extract a component.

## `bellona/react-no-jsx-module-constants`

Disallow module-level `const icon = <Svg />`.

Prefer: a component file, then `<Icon />`.

## `bellona/react-no-jsx-variable-reassignment-in-components`

Disallow `let ui = …; ui = <Other />` to build JSX.

Prefer: inline conditionals or a child component.

## `bellona/react-no-multi-component-files`

One **primary** React component per file. Helpers named `*Impl` / `*Provider` / `*Context` are not “primary”.

## `bellona/react-no-multi-hook-files`

One React hook per `use-*.ts(x)` file.

## `bellona/react-no-native-html`

Disallow listed native HTML tags so the app uses design-system components.

**Exception:** tags inside a `Typeset` element, or an ancestor with `data-slot="typeset"` / class `typeset` (prose).

| Option | Default |
| --- | --- |
| `tags` | high-confidence set below |
| `replacements` | `{}` |

Default `tags`: `button`, `input`, `textarea`, `select`, `option`, `optgroup`, `label`, `img`, `video`, `audio`, `picture`, `source`, `iframe`, `dialog`, `details`, `summary`, `progress`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`, `hr`.

```ts
'bellona/react-no-native-html': [
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

## `bellona/react-no-namespace`

Disallow `import React from 'react'`, `import * as React from 'react'`, `React.useState`, and `React.ReactNode` namespace types.

Prefer: `import { useState, type ReactNode } from 'react'`.

Runs on test-skipped TS/TSX (not JSX-only).

## `bellona/react-no-render-helper-functions-in-components`

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
