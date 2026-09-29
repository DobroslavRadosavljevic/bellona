# bellona/tailwind rules

Plugin name: `bl-tailwind`. Ids: `bl-tailwind/<slug>`.

**Skip:** test/spec/stories files and `allow` matches. There is **no** import gate. Tailwind class strings do not need a `tailwindcss` import.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-tailwind/no-classname-constants`

Do not store Tailwind class names in `const` / `let` / `var` bindings or class fields.

Prefer a `tv` / `createTV` recipe, or a reusable component with inline `className`.

Two messages:

- `storedClassNames`: a module-level constant or a class field. It is a second styling API that other code can import and mix.
- `localClassNames`: a variable inside a function (`const chipClassName = cn(…)` in a component). The classes then live away from the element. Write them in `className`, or use a `tv` recipe for variants and states.

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

- Every token must look like a class token. Sentences, URLs, CSS (`display: flex`), and MIME types do not match.
- A **strong** token has a variant, opacity, important mark (`!flex` or v4 `flex!`), negative mark, arbitrary value (`w-[112px]`), v4 CSS variable value (`w-(--sidebar-width)`), or a known prefix plus a default Tailwind value (`items-center`, `bg-white/10`, `gap-1.5`, `from-10%`).
- A known prefix plus a project value is **weak** (`bg-primary`, `text-muted-foreground`). Tailwind v4 makes a utility for each `@theme` variable, so these are real classes. With a variant or opacity they are strong (`hover:bg-accent`, `text-muted-foreground/80`). English compounds such as `end-user` and `top-level` are also weak, so they never match alone.
- Bare words such as `flex`, `hidden`, `group`, and `peer` are **weak**. A list of only weak words is not flagged unless the binding name contains `className` / `classNames` / `classes`.
- The heuristic knows the Tailwind 4.3 utility families, including logical sizes (`inline-*`, `block-*`), `mask-*`, `scrollbar-*`, `field-sizing-*`, `@container`, named groups (`group/item`), and the `mauve` / `mist` / `olive` / `taupe` colors.
- Without a name hint, at least one strong token and `minUtilities` tokens are required.
- Strings inside `tv(...)` and `createTV(...)` are skipped.

| Option | Default | Role |
| --- | --- | --- |
| `allow` | `[]` | Path substring / basename skip |
| `minUtilities` | `2` | Minimum utility tokens when the name is not a class-name binding |
| `allowedCallees` | `['tv', 'createTV']` | Factory calls whose string arguments are not scanned |

Add `cva` (or another recipe helper) through `allowedCallees` when that stack is in use.

## Class positions

`no-v3-arbitrary-var` and `no-dynamic-class-construction` read only class positions:

- JSX attributes `className`, `class`, and any attribute that ends in `ClassName` (`contentClassName`).
- Arguments of `cn`, `clsx`, `cx`, `classnames`, `classNames`, `twMerge`, `twJoin`, `cnMerge`, `tv`, `cva`. Strings in arrays, conditionals, object keys, and object values count. A nested helper call is read one time.

Other strings (`key={…}`, labels, ids) are not read.

| Option | Default | Role |
| --- | --- | --- |
| `allow` | `[]` | Path substring / basename skip |
| `attributes` | `['className', 'class']` | Class attributes (names that end in `ClassName` always count) |
| `callees` | list above | Class helper calls |

## `bl-tailwind/no-v3-arbitrary-var`

Report Tailwind v3 syntax that is wrong in v4.

| Class | Problem | Fix |
| --- | --- | --- |
| `bg-[--brand]` | v4 makes `background-color: --brand` (not valid CSS) | `bg-(--brand)` or `bg-[var(--brand)]` |
| `bg-opacity-*`, `text-opacity-*`, `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*`, `placeholder-opacity-*` | v4 makes no CSS | an opacity modifier: `bg-black/50` |
| `flex-shrink-*`, `flex-grow-*` | v3 name, kept only for compatibility | `shrink-*`, `grow-*` |
| `overflow-ellipsis` | v3 name | `text-ellipsis` |
| `decoration-slice`, `decoration-clone` | v3 name | `box-decoration-slice`, `box-decoration-clone` |

Variants, `!`, and opacity stay in the suggested fix (`hover:bg-[--x]/50` → `hover:bg-(--x)/50`). Renamed but valid v4 classes such as `shadow-sm`, `rounded`, `outline-none`, and `ring` are not reported.

## `bl-tailwind/no-dynamic-class-construction`

Report a template literal in a class position that builds a class name at runtime: the text before `${…}` ends in a utility prefix plus `-` or `-[`.

```tsx
// bad
<div className={`bg-${hue}-500`} />
<div className={cn('flex', `w-[${width}px]`)} />

// good
const swatch = tv({ variants: { hue: { red: 'bg-red-500', blue: 'bg-blue-500' } } })
<div className={swatch({ hue })} />
<div className="w-(--width)" style={{ '--width': `${width}px` }} />
```

Tailwind reads source files as plain text and makes CSS only for complete class names.
