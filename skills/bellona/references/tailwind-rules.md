# bellona/tailwind rules

Plugin name: `bl-tailwind`. Ids: `bl-tailwind/<slug>`.

**Skip:** test/spec/stories files and `allow` matches. There is **no** import gate. Tailwind class strings do not need a `tailwindcss` import.

## `bl-tailwind/no-classname-constants`

Do not store Tailwind class names in `const` / `let` / `var` bindings or class fields.

Prefer a `tv` / `createTV` recipe, or a reusable component with inline `className`.

```ts
// bad
export const lightboxControlClassName =
  'text-white hover:bg-white/10 data-pressed:bg-white/16'
const shared = 'flex items-center gap-2'
const className = cn('flex items-center', extra)

// good
const control = tv({
  base: 'text-white hover:bg-white/10 data-pressed:bg-white/16',
})

function Control(props: ControlProps) {
  return <button className={control()} />
}
```

Detection:

- Every token must look like a class token. Sentences, URLs, CSS (`display: flex`), MIME types, and English compounds (`end-user`, `top-level`) do not match.
- A **strong** token has a variant, opacity, important/negative mark, arbitrary value, or a known prefix plus a Tailwind value (`items-center`, `bg-white/10`, `gap-2`).
- Bare words such as `flex` and `hidden` are **weak**. A list of only weak words is not flagged unless the binding name contains `className` / `classNames` / `classes`.
- Without a name hint, at least one strong token and `minUtilities` tokens are required.
- Strings inside `tv(...)` and `createTV(...)` are skipped.

| Option | Default | Role |
| --- | --- | --- |
| `allow` | `[]` | Path substring / basename skip |
| `minUtilities` | `2` | Minimum utility tokens when the name is not a class-name binding |
| `allowedCallees` | `['tv', 'createTV']` | Factory calls whose string arguments are not scanned |

Add `cva` (or another recipe helper) through `allowedCallees` when that stack is in use.
