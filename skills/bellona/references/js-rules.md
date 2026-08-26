# bellona/js rules

Plugin name: `bl-js`. Ids: `bl-js/<slug>`. **No import gate. No test skip.** These run on every linted JS/TS file once enabled.

Evidence rules are syntactic (file-local aliases). They do not need `--type-aware`.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

Shared intent: keep known types, parse `unknown` at I/O boundaries, avoid `Reflect`, module mocks, and pass-through re-exports.

## `bl-js/max-classes`

Disallow more than `max` **class declarations** in one file. Class expressions do not count.

| Option | Default |
| --- | --- |
| `max` | `5` |

```ts
// bad (6th ClassDeclaration)
// good: split files, or { max: 10 }
```

## `bl-js/no-chained-type-assertions`

Disallow chained `as` / angle-bracket assertions, including parenthesized chains (`(x as A) as B`).

Prefer: keep the original type, or parse once at the boundary.

## `bl-js/no-conditional-empty-object-spread`

Disallow `{ ...cond && {} }` / `{ ...(cond ? extra : {}) }` style spreads that hide omission behind an empty object.

Prefer: build the object in statements; add the property only when present.

## `bl-js/no-inline-import-type`

Disallow TypeScript `import("…")` types, including `import("./mod").Name` and `typeof import("./mod")`.

Prefer a top-level type import:

```ts
// bad
useRef<import("./lightbox-context").LightboxTravel | null>(null)

// good
import type { LightboxTravel } from './lightbox-context'

useRef<LightboxTravel | null>(null)
```

Runtime `import("./mod")` (a dynamic import expression) is allowed.

## `bl-js/no-known-value-widening`

Disallow annotating a syntactically known value with a broad/anonymous type (`unknown`, `object`, open dictionaries, empty object types, generic containers) that discards evidence.

Prefer: inference, `satisfies`, or a named owner type.

## `bl-js/no-module-mocking`

Disallow Vitest/Jest module mocks: `vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, and the same on `jest` (global or imported from `vitest` / `@jest/globals`).

Prefer: inject a real interface, service, or test double.

## `bl-js/no-object-parameters`

Disallow parameters typed as `object`.

Prefer: a named owner type; parse external input before the call.

## `bl-js/no-reflect-apply`

Disallow `Reflect.apply`. Call the function, or put dynamic dispatch behind an interface.

## `bl-js/no-reflect-get`

Disallow `Reflect.get`. Use typed property access, or parse dynamic input first.

## `bl-js/no-runtime-typeof`

Disallow runtime `typeof` checks. They narrow a representation without a contract.

| Option | Default |
| --- | --- |
| `allowInTypeGuards` | `false` |

When `allowInTypeGuards: true`, `typeof` inside a function with a `is X` type-predicate return is allowed.

Prefer: decode at the I/O boundary (Zod, Effect Schema, …), then branch on the domain value.

## `bl-js/no-shape-in-symbol-names`

Disallow a substring in JS/TS/private/JSX symbol names.

| Option | Default |
| --- | --- |
| `term` | `'shape'` |
| `caseSensitive` | `false` |

Rename `UserShape` → `User`, `ParsedUser`, or an owner name. The word “shape” is treated as structure, not ownership.

## `bl-js/no-unknown-parameters`

Disallow parameters typed `unknown`.

| Option | Default |
| --- | --- |
| `allow` | `['cause']` |

`cause` is allowed for error enrichment. Parse at the boundary; pass a named type inward.

## `bl-js/no-unknown-returns`

Disallow explicit return types `unknown` or `Promise<unknown>` (including signatures).

Prefer: a named domain type after parsing.

## `bl-js/no-unknown-type-aliases`

Disallow `type Foo = unknown` (and aliases that resolve to `unknown` in-file). Keep `unknown` visible at the parsing boundary.

## `bl-js/no-unsafe-dictionary-type`

Disallow dictionaries whose value type is `unknown`, `any`, `object`, `{}`, or a union/alias containing those.

Prefer: `Record<string, User>` (or schema-derived values). Parse payloads before insert.

## `bl-js/no-useless-reexport`

Disallow files that only re-export, and unchanged re-exports in mixed files.

A **re-export** is `export … from`, `export *`, or an import that is exported and never used in the file.

| Option | Default |
| --- | --- |
| `allow` | `[]` (path substring / basename skip) |
| `allowRenames` | `true` |

Prefer: import from the source module at the use site.

```ts
// bad — file only re-exports
export { User } from './user'
export * from './models'

// bad — mixed file, unchanged re-export
export function loadUser() {}
export { User } from './user'

// good — the file owns the code
export function loadUser() {
  return { id: '1' }
}

// good — mixed file, the name change is the public API
export function loadUser() {}
export { InternalUser as User } from './internal'

// good — import is used here, then also exported
import { foo, fooName } from './foo'
const plugin = { [fooName]: foo }
export { foo, fooName }
```

A rename-only file is still a re-export file. Put a public alias in `allow`, or import the source name at the use site.

This rule does **not** skip tests. `allow` skips matching files.

## `bl-js/no-widen-then-assert`

Disallow `const x: unknown = value; … x as User` in the same function: widen, then assert back.

Prefer: keep the precise type from init, or parse once.

## `bl-js/require-safety-comment-for-type-assertion`

Every `as T` / `<T>x` except `as const` needs a nearby comment containing `MARKER:`.

| Option | Default |
| --- | --- |
| `marker` | `'SAFETY'` |

```ts
// SAFETY: JSON.parse was validated with UserSchema.parse
const user = payload as User;
```

The comment must sit on the assertion or its containing statement (`ExpressionStatement`, `VariableDeclaration`, `ReturnStatement`, `ThrowStatement`, `PropertyDefinition`).
