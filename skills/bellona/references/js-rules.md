# bellona/js rules

Plugin name: `bl-js`. Ids: `bl-js/<slug>`. **No import gate. No test skip.** These run on every linted JS/TS file once enabled.

Evidence rules are syntactic (file-local aliases). They do not need `--type-aware`.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

Shared intent: keep known types, parse `unknown` at I/O boundaries, avoid module mocks and pass-through re-exports.

Rules that take `{ allow }` skip a file when an entry matches a path substring or the basename.

## `bl-js/no-chained-type-assertions`

Disallow chained `as` / angle-bracket assertions, including parenthesized chains (`(x as A) as B`).

Prefer: keep the original type, or parse once at the boundary.

## `bl-js/no-generic-module-names`

Disallow generic folder and file names: a whole path segment or file name in `names`, or a file name that ends in `-utils` / `-helpers` (also `.utils`, `_helpers`). The rule reads only the file path, once per file. Tests, stories, generated files, and `.d.ts` files are skipped.

| Option | Default |
| --- | --- |
| `names` | `['utils', 'util', 'helpers', 'helper', 'common', 'misc', 'stuff', 'things']` |
| `allow` | `[]` (path substring / basename skip) |

`lib`, TanStack `-lib` colocation folders, and `shared` are allowed by default. Add `shared` to `names` to ban it too. A TanStack `-utils` folder counts as `utils`. A singular suffix (`prefer-status-helper.ts`) is not checked, because it often names a concept.

```text
bad:  src/utils/format.ts, src/common/index.ts, src/charts/motion-utils.ts
good: src/pricing/price-rules.ts, src/charts/motion-easing.ts, src/routes/posts/-lib/post-query.ts
```

Prefer: name the module after the concept it owns (`pricing/`, `person-name.ts`).

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

For `typeof import("./mod")`, use `import type * as Mod from './mod'` and `typeof Mod`.

Runtime `import("./mod")` (a dynamic import expression) is allowed.

A declaration file (`.d.ts`, `.d.mts`, `.d.cts`) with no top-level `import` or `export` is not checked. It is a global script (`env.d.ts`, `worker-configuration.d.ts`). A top-level `import type` makes it a module, and its interfaces stop merging with the global ones.

## `bl-js/no-known-value-widening`

Disallow annotating a syntactically known value with a broad type (`unknown`, `object`, a dictionary with broad keys, a generic dictionary alias) that discards evidence. An inline object type gets a separate `anonymousObject` report: it repeats the inferred type and has no owner name.

A dictionary has broad keys when the key type is `string`, `number`, `symbol`, `PropertyKey`, or a template type such as `` `model-${string}` ``. A closed key union makes the map exhaustive, so it is not reported:

```ts
// good: the annotation checks that every Tone has a badge
const badge: Record<Tone, string> = { info: 'a', warn: 'b' }

// good: this file reads the table by a runtime key (TS7053 without the annotation)
const prices: Record<string, number> = { a: 1 }
export function price(id: string) { return prices[id] }

// bad: only static keys are read
const labels: Record<string, string> = { save: 'Save' }
```

Prefer: inference, `satisfies`, or a named owner type. To let other modules read a table by a runtime key, export a lookup function from the file that owns the table.

## `bl-js/no-module-mocking`

Disallow test module mocks: `vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, the same on `jest` (global or imported from `vitest` / `@jest/globals`), and `mock.module` from `bun:test` or `node:test`.

Prefer: inject a real interface, service, or test double.

## `bl-js/no-object-keys-assertion`

Disallow a type assertion on the result of `Object.keys(x)` or `Object.entries(x)` (`as …` and `<T>…`). TypeScript types the keys as `string` on purpose: an object type is open, so a value can have more own keys than its type lists.

| Option | Default |
| --- | --- |
| `allow` | `[]` |

```ts
// bad
for (const key of Object.keys(next) as Array<keyof T>) {}

// good: loop over a declared list of the known keys
const fields = ['id', 'name'] as const
for (const key of fields) {}
```

## `bl-js/no-object-parameters`

Disallow parameters typed as `object`.

The implementation signature of an overloaded function or method is not checked. Callers see only the overload signatures.

Prefer: a named owner type; parse external input before the call.

## `bl-js/no-runtime-typeof`

Disallow runtime `typeof` checks on values with no declared contract: `unknown`, `any`, no annotation, an unconstrained type parameter, untyped data, or a local type with no primitive or function member. There, `typeof` narrows a representation without a contract.

`typeof` on a **declared union** is allowed. TypeScript narrows a union with `typeof` (handbook, Narrowing), so the union is the contract. The operand is a parameter or local binding, or one member of it (`props.style`, or `{ style }: Props`), whose annotation in this file is a union with:

- at least one `typeof` member: `string`, `number`, `boolean`, `bigint`, `symbol`, `undefined`, a literal type, `string & {}`, or a function type;
- at least one other member (an optional parameter `x?: T` adds `undefined`);
- no `unknown` or `any` member.

Local type aliases and local interfaces are resolved. A default in a destructured parameter (`{ grid = false }: Props`, `{ grid: g = false }: Props`) does not change the member type.

With no annotation, the rule **traces** the value back to an annotated source, up to 8 steps:

- a `const` (or a `let` that is never reassigned) set from a traced value;
- a member read (`props.dataKey`, `props?.dataKey`) or an indexed read (`row[key]`) of a traced value. A union with `undefined` or `null` (`props: BarProps | undefined`) reads its other members;
- a `for…of` element of `T[]`, `readonly T[]`, `Array<T>`, or `ReadonlyArray<T>`;
- a destructured element of a traced value;
- a conditional whose branches all trace;
- an `as T` / `<T>` assertion: `T` is the type. `as unknown` and `as any` are still reported.

A value that does not trace (a call result, `JSON.parse`, a reassigned `let`) is still reported.

```ts
// good: each value traces to an annotation
const props = child.props as BarProps | undefined
typeof props?.dataKey === 'string'

for (const item of data) typeof item === 'number' // data: readonly SparkbarDatum[]

const raw = row[key] // row: ChartDatum
typeof raw === 'string'
```

A **named type that this file cannot read** is a declared contract, so `typeof` on it is allowed: an imported type (`item: SparkbarDatum`), an indexed access (`type: ReactElement["type"]`), a qualified name (`React.ReactNode`), a type query (`typeof defaults.size`), and a member of an imported or inherited props type. Other bl-js rules check that type where it is declared (for example `bl-js/no-unknown-type-aliases`). A type that holds `unknown` or `any` is still reported, and so is a local type that resolves to objects only (`type User = { id: string }`, `Record<string, unknown>`, `Date`).

A **global lib type** (not declared in this file and not imported) is also a declared contract: `entry: FormDataEntryValue` (`File | string`), `key: PropertyKey`, and members such as `init.body` of `RequestInit`. Known object-only globals are still reported, because `typeof` has nothing to narrow on them:

- `Date`, `RegExp`, `Error` and every `*Error`;
- `Map`, `Set`, `WeakMap`, `WeakSet`, `WeakRef`, `ReadonlyMap`, `ReadonlySet`;
- `Array`, `ReadonlyArray`, `Record`, `Object`, `Promise`, `PromiseLike`, `Generator`, `AsyncGenerator`;
- `ArrayBuffer`, `SharedArrayBuffer`, `DataView`, typed arrays (`Uint8Array`, …);
- `URL`, `URLSearchParams`, `Headers`, `Request`, `Response`, `FormData`, `Blob`, `File`;
- `Element`, `HTML*Element`, `SVG*Element`, `Node`, `NodeList`, `HTMLCollection`, `Text`, `Document`, `Window`, `EventTarget`, and every `*Event`.

`Partial<X>`, `Readonly<X>`, `Required<X>`, `NonNullable<X>`, and `Awaited<X>` resolve through `X`. A member read of `Record<K, V>` gives `V`.

A type parameter counts as its constraint: `<T extends Probe>(value: T)` narrows like `value: Probe`. The constraint can be a local alias, an inline union, or another constrained type parameter, on the enclosing function, method, class, interface, or type alias. An unconstrained `T`, `T extends unknown`, `T extends object`, and a default (`T = string | number`) are still reported, because `T` can then be `unknown`.

```ts
type ChartValue = number | string | ChartCallable | undefined

// good
export function isChartNumber<T extends ChartValue>(value: T): value is Extract<T, number> {
  return typeof value === 'number' && Number.isFinite(value)
}

// bad: T can be unknown
export function isChartNumber<T>(value: T): value is Extract<T, number> {
  return typeof value === 'number'
}
```

Do not replace `typeof` with tag checks such as `Object.prototype.toString.call(x)`, `instanceof Object`, `z.function().safeParse(x)`, or `Number.isFinite(x as number)`.

```ts
// good
function resolveClassName(className: string | ((state: State) => string), state: State) {
  return typeof className === 'function' ? className(state) : className
}

// bad: no declared contract
function isText(value: unknown) { return typeof value === 'string' }
```

A **small decoder** is the parse boundary, so `typeof` and its `unknown` parameter are allowed there (option `allowDecoders`, default `true`, on `bl-js/no-runtime-typeof` and `bl-js/no-unknown-parameters`). A function is a decoder when:

- it has exactly one parameter, typed `unknown`;
- it has an explicit return type that carries data: not `boolean`, `void`, `never`, `undefined`, `unknown`, `any`, or a type predicate, and no `unknown` / `any` union member (`Promise<T>` is checked as `T`);
- its body has no `as T`, `<T>x`, `x!`, or `any` (`as const` is allowed).

With no escape hatch, TypeScript proves that each return value came from a check on the input. So each path returns a narrowed value, `undefined` / `null`, or throws.

```ts
// good: a decoder for an untyped Base UI Dialog payload, with no schema library
export function readLightboxIndex(payload: unknown): number | undefined {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload
  if (payload !== null && typeof payload === 'object' && 'index' in payload && typeof payload.index === 'number') {
    return payload.index
  }
  return undefined
}

// bad: the assertion skips the proof
function readIndex(payload: unknown): number { return payload as number }
```

`typeof` inside a schema predicate is allowed. The predicate is the boundary decoder: `z.custom(fn)`, `.refine(fn)`, `.superRefine(fn)`, `Schema.declare(fn)`, `Schema.makeFilter(fn)`, `Schema.filter(fn)`, and `Predicate.*(fn)`. `Array.prototype.filter` is not a schema predicate.

| Option | Default |
| --- | --- |
| `allowInTypeGuards` | `false` |
| `allowDecoders` | `true` |

When `allowInTypeGuards: true`, `typeof` inside a function with a `is X` type-predicate return is allowed. This option is only for guards on `unknown` or untyped input. A guard on a declared union (`(v: string | number): v is string`) is allowed without it.

A feature test of an undeclared global is always allowed: `typeof window === 'undefined'`, `typeof Bun`, `typeof globalThis.structuredClone`. `typeof` is the only check that does not throw a ReferenceError there. A name that this file declares (import, parameter, variable) is still reported.

Prefer: decode at the I/O boundary (Zod, Effect Schema, …), then branch on the domain value.

## `bl-js/no-shape-in-symbol-names`

Disallow a substring in the names that a file declares: bindings, parameters, functions, classes, types, enums, type parameters, own members, private fields, import aliases, and export aliases.

Uses of a name (`schema.shape`, `<Shape />`, an object key sent to an API) and imports that keep the source module name (`import { Shape } from 'konva'`) are not reported. Another module owns those names. A declaration reports once, not at each use.

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
| `allowDecoders` | `true` |

`cause` is allowed for error enrichment. The implementation signature of an overloaded function or method is not checked. Parse at the boundary; pass a named type inward.

The single `unknown` parameter of a small decoder is not checked when `allowDecoders` is `true`. See `bl-js/no-runtime-typeof` for the decoder conditions.

The input of a callback parameter type is not checked: `decode: (body: unknown) => A`, also in an inline options type (`options: { decode(body: unknown): A }`) and in an interface method parameter. This function calls the callback, so the `unknown` value flows out to the decoder, not in from callers. A standalone type (`type Decoder<A> = (body: unknown) => A`), an interface property, a return type, and a callback of a callback are still checked.

## `bl-js/no-unknown-returns`

Disallow explicit return types `unknown` or `Promise<unknown>` (including signatures). The implementation signature of an overloaded function or method is not checked.

Prefer: a named domain type after parsing.

## `bl-js/no-unknown-type-aliases`

Disallow `type Foo = unknown` (and aliases that resolve to `unknown` in-file). Keep `unknown` visible at the parsing boundary.

## `bl-js/no-unsafe-dictionary-type`

Disallow dictionaries whose value type is `unknown`, `any`, `object`, `{}`, or a union/alias containing those.

A type parameter constraint (`T extends Record<string, unknown>`) and the test of a conditional type (`X extends Record<string, unknown> ? A : B`) are not reported. They only limit a type argument; code reads the argument type. A type parameter default is still reported.

A parameter annotation of a contextually typed function is not reported. The function is a call argument, a JSX expression, a `satisfies` value, or the value of an annotated variable, also inside object and array literals. Example: `createRoute({ validateSearch: (search: Record<string, unknown>) => … })`. The library type already gives that parameter type, and without the annotation TypeScript infers the same type. A function declaration, an unannotated object literal, and a return type are still reported.

Prefer: `Record<string, User>` (or schema-derived values). Parse payloads before insert.

## `bl-js/no-untyped-json`

Disallow a `JSON.parse(…)` or awaited zero-argument `….json()` result that leaks as `any`. TypeScript types `JSON.parse` as `any` and `Response.json()` as `Promise<any>`, so later uses have no type checks.

Reported uses: a binding with no annotation or with a domain annotation (`const user: User = JSON.parse(text)` is an unchecked cast), a return value, a member access, and `as T` / `<T>` (except `as unknown`).

Allowed: a `: unknown` binding, a direct call argument (`UserSchema.parse(JSON.parse(text))`), `satisfies`, and a return from a function that declares `unknown` or `Promise<unknown>`.

| Option | Default |
| --- | --- |
| `allow` | `[]` |

```ts
// bad
const user = JSON.parse(text) as User
return await response.json()

// good
const user = UserSchema.parse(JSON.parse(text))
const body: unknown = await response.json()
```

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

These files are always skipped:

- Tool config files (`*.config.ts`, `*.config.mjs`, …). Tools load them by path, so no use site can import the source.
- Files with a `"use client"` or `"use server"` directive. The directive makes the file a bundler boundary, for example a client wrapper for a third-party component.

## `bl-js/no-widen-then-assert`

Disallow `const x: unknown = value; … x as User` in the same function: widen, then assert back.

Prefer: keep the precise type from init, or parse once.

## `bl-js/require-file-layout`

Require files under configured folders to sit in allowed places. The rule reads only the file path, once per file, relative to the lint working directory with `/` separators. Tests, stories, generated files, and `.d.ts` files are skipped.

Paths use glob-lite: `*` matches inside one segment, `**` matches any number of segments, `?` matches one character. A pattern matches from the start of the path, so begin a `root` with `**/` to match at any depth.

| Option | Default | Meaning |
| --- | --- | --- |
| `layouts` | `[]` | `{ root, allow, message? }` items. A file under a folder that matches `root` must match one `allow` pattern, relative to that folder. `message` is added to the report. |
| `servicesFolderContents` | `true` | A file directly in a `services` folder must be a `*.service.ts` file. Subfolders (`services/errors/`) are not checked. |
| `serviceDirectories` | `[]` | Root globs where a `*.service.ts` file must sit in a `services` folder. Empty turns this check off: many projects keep services in concept folders (`src/meter/meter.service.ts`). |
| `allow` | `[]` | Path substring / basename skip. |

```ts
'bl-js/require-file-layout': ['error', {
  layouts: [{
    root: '**/src/modules/*/',
    allow: ['live.ts', 'routes/*.ts', 'schema/*.ts', 'services/*.service.ts', 'services/errors/*.error.ts', 'domain/**'],
    message: 'Put pure module logic in domain/.',
  }],
  serviceDirectories: ['**/src/modules/*/'],
}]
```

A file gets at most one layout report. Use a root that fits one kind of module; a front-end `src/modules` folder often has a different layout than a server one.

## `bl-js/require-own-key-lookup`

Require an own-key check before `table[key]` with a runtime `key`, when `table` is a `const` in this file with an open dictionary type (`Record<string, V>`, `{ [key: string]: V }`, a `${string}` template key, or a local alias of one) and an object literal value. The literal inherits `Object.prototype`, so `table['constructor']` returns a function typed as `V`.

An own-key check is `Object.hasOwn(table, key)`, `Object.prototype.hasOwnProperty.call(table, key)`, or `table.hasOwnProperty(key)` with the same key text, in the same function or an enclosing one. `key in table` is **not** an own-key check: `in` also finds inherited keys.

Not reported: static keys, writes (`table[key] = v`), keys from `for (const key in table)`, `for (const key of Object.keys(table))`, or an `Object.keys(table)` callback, closed key unions, `Map`, `Object.create(null)` tables, `let` bindings, and parameters.

| Option | Default |
| --- | --- |
| `allow` | `[]` |

```ts
const prices: Record<string, number> = { a: 1 }

// bad
const read = (id: string) => prices[id]

// good
const read = (id: string) => (Object.hasOwn(prices, id) ? prices[id] : undefined)
```

## `bl-js/require-safety-comment-for-type-assertion`

Every `as T` / `<T>x` except `as const` needs a nearby comment containing `MARKER:`.

| Option | Default |
| --- | --- |
| `marker` | `'SAFETY'` |

```ts
// SAFETY: JSON.parse was validated with UserSchema.parse
const user = payload as User;
```

The comment must sit on the assertion or on the nearest statement or class field that contains it. A comment above `export` counts for `export const x = y as T`. A comment above an enclosing function or block does not count for an assertion inside it.

## Removed rules

Oxlint built-ins replace these rules. Use the config below.

- `bl-js/max-classes` → `"eslint/max-classes-per-file": ["error", { "max": 5, "ignoreExpressions": true }]`
- `bl-js/no-reflect-apply` and `bl-js/no-reflect-get` → `"eslint/no-restricted-properties": ["error", { "object": "Reflect", "property": "apply", "message": "Call the function directly. Wrong arguments make Reflect.apply return any with no error." }, { "object": "Reflect", "property": "get", "message": "Use typed property access. Reflect.get returns any for a key that the type does not list." }]`
- `bl-js/no-conditional-empty-object-spread` → no replacement. `{ ...(cond ? { b } : {}) }` is the usual form with `exactOptionalPropertyTypes`, and TypeScript types it as `{ b?: … }`.
