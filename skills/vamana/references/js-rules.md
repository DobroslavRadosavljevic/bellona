# vamana/js rules

Plugin name: `js`. Ids: `js/vm-<slug>`. **No import gate. No test skip.** These run on every linted JS/TS file once enabled.

Evidence rules are syntactic (file-local aliases). They do not need `--type-aware`.

Shared intent: keep known types, parse `unknown` at I/O boundaries, avoid `Reflect` and module mocks.

## `js/vm-max-classes`

Disallow more than `max` **class declarations** in one file. Class expressions do not count.

| Option | Default |
| --- | --- |
| `max` | `5` |

```ts
// bad (6th ClassDeclaration)
// good: split files, or { max: 10 }
```

## `js/vm-no-chained-type-assertions`

Disallow chained `as` / angle-bracket assertions, including parenthesized chains (`(x as A) as B`).

Prefer: keep the original type, or parse once at the boundary.

## `js/vm-no-conditional-empty-object-spread`

Disallow `{ ...cond && {} }` / `{ ...(cond ? extra : {}) }` style spreads that hide omission behind an empty object.

Prefer: build the object in statements; add the property only when present.

## `js/vm-no-known-value-widening`

Disallow annotating a syntactically known value with a broad/anonymous type (`unknown`, `object`, open dictionaries, empty object types, generic containers) that discards evidence.

Prefer: inference, `satisfies`, or a named owner type.

## `js/vm-no-module-mocking`

Disallow Vitest/Jest module mocks: `vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, and the same on `jest` (global or imported from `vitest` / `@jest/globals`).

Prefer: inject a real interface, service, or test double.

## `js/vm-no-object-parameters`

Disallow parameters typed as `object`.

Prefer: a named owner type; parse external input before the call.

## `js/vm-no-reflect-apply`

Disallow `Reflect.apply`. Call the function, or put dynamic dispatch behind an interface.

## `js/vm-no-reflect-get`

Disallow `Reflect.get`. Use typed property access, or parse dynamic input first.

## `js/vm-no-runtime-typeof`

Disallow runtime `typeof` checks. They narrow a representation without a contract.

| Option | Default |
| --- | --- |
| `allowInTypeGuards` | `false` |

When `allowInTypeGuards: true`, `typeof` inside a function with a `is X` type-predicate return is allowed.

Prefer: decode at the I/O boundary (Zod, Effect Schema, …), then branch on the domain value.

## `js/vm-no-shape-in-symbol-names`

Disallow a substring in JS/TS/private/JSX symbol names.

| Option | Default |
| --- | --- |
| `term` | `'shape'` |
| `caseSensitive` | `false` |

Rename `UserShape` → `User`, `ParsedUser`, or an owner name. The word “shape” is treated as structure, not ownership.

## `js/vm-no-unknown-parameters`

Disallow parameters typed `unknown`.

| Option | Default |
| --- | --- |
| `allow` | `['cause']` |

`cause` is allowed for error enrichment. Parse at the boundary; pass a named type inward.

## `js/vm-no-unknown-returns`

Disallow explicit return types `unknown` or `Promise<unknown>` (including signatures).

Prefer: a named domain type after parsing.

## `js/vm-no-unknown-type-aliases`

Disallow `type Foo = unknown` (and aliases that resolve to `unknown` in-file). Keep `unknown` visible at the parsing boundary.

## `js/vm-no-unsafe-dictionary-type`

Disallow dictionaries whose value type is `unknown`, `any`, `object`, `{}`, or a union/alias containing those.

Prefer: `Record<string, User>` (or schema-derived values). Parse payloads before insert.

## `js/vm-no-widen-then-assert`

Disallow `const x: unknown = value; … x as User` in the same function: widen, then assert back.

Prefer: keep the precise type from init, or parse once.

## `js/vm-require-safety-comment-for-type-assertion`

Every `as T` / `<T>x` except `as const` needs a nearby comment containing `MARKER:`.

| Option | Default |
| --- | --- |
| `marker` | `'SAFETY'` |

```ts
// SAFETY: JSON.parse was validated with UserSchema.parse
const user = payload as User;
```

The comment must sit on the assertion or its containing statement (`ExpressionStatement`, `VariableDeclaration`, `ReturnStatement`, `ThrowStatement`, `PropertyDefinition`).
