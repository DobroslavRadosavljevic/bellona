# bellona/effect rules

Plugin name: `effect`. Ids: `effect/bn-<slug>`. Target **Effect v4** (`effect@rc`). Do not mix v3 APIs.

**Skip (all):** files that do not import `effect`, `effect/…`, or `@effect/…`, and `allow` matches.

**Also skip tests** (style rules): marked **tests skipped** below.

**Tests only:** `bn-prefer-effect-vitest`.

Bindings follow namespace and named imports (`Effect.fn` and `import { fn } from 'effect/Effect'`). See [how-it-works.md](how-it-works.md).

## v3 → v4

### `effect/bn-no-v3-imports`

Disallow moved v3 specifiers. Exact map (partial):

| From | To |
| --- | --- |
| `effect/Either` | `effect/Result` |
| `effect/FiberRef` | `effect/References` |
| `effect/JSONSchema` | `effect/JsonSchema` |
| `effect/TestClock` | `effect/testing/TestClock` |
| `effect/FastCheck` | `effect/testing/FastCheck` |
| `effect/TRef` (and other `T*`) | `effect/TxRef` (`Tx*`) |
| `@effect/platform/HttpClient` (and HttpServer/Router) | `effect/unstable/http` |
| `@effect/platform/HttpApi*` | `effect/unstable/httpapi` |
| `@effect/sql/*` | `effect/unstable/sql` |
| `@effect/cli/*` | `effect/unstable/cli` |
| `@effect/rpc/*` | `effect/unstable/rpc` |
| `@effect/cluster/*` | `effect/unstable/cluster` |
| `@effect/workflow/*` | `effect/unstable/workflow` |
| `@effect/ai/*` | `effect/unstable/ai` |
| `@effect/opentelemetry/Otlp*` | `effect/unstable/observability` |
| `effect/Mailbox` | `effect/Queue` |
| `@effect/platform/FileSystem` | `effect/FileSystem` |
| `@effect/platform/Path` | `effect/Path` |

Current v4 packages are **not** flagged: `effect`, `effect/…`, `@effect/vitest`, `@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`, `@effect/atom-*`, `@effect/opentelemetry` (SDK, not the old Otlp helpers).

### `effect/bn-no-v3-effect-apis`

| Old | New |
| --- | --- |
| `Effect.catchAll` | `Effect.catch` |
| `Effect.catchAllCause` | `Effect.catchCause` |
| `Effect.catchAllDefect` | `Effect.catchDefect` |
| `Effect.catchSome` | `Effect.catchFilter` |
| `Effect.catchSomeCause` | `Effect.catchCauseFilter` |
| `Effect.catchSomeDefect` | removed (typed defects only) |
| `Effect.async` / `asyncEffect` | `Effect.callback` |
| `Effect.either` | `Effect.result` |
| `Effect.zipRight` | `Effect.andThen` |
| `Effect.zipLeft` | `Effect.zip` + `Effect.map` |
| `Effect.fork` | `Effect.forkChild` |
| `Effect.forkDaemon` | `Effect.forkDetach` |
| `Effect.forkAll` / `forkWithErrorHandler` | removed |
| `Layer.scoped*` | `Layer.effect*` |
| `Layer.catchAll` | `Layer.catch` |
| `Stream.async` | `Stream.callback` |
| `Scope.extend` | `Scope.provide` |

### `effect/bn-no-v3-service-tags`

Disallow `Context.Tag`, `GenericTag`, `Effect.Tag`, `Effect.Service`. Use `Context.Service`.

### `effect/bn-prefer-decode-unknown-effect`

| Old | New |
| --- | --- |
| `Schema.decodeUnknown` | `Schema.decodeUnknownEffect` |
| `Schema.encodeUnknown` | `Schema.encodeUnknownEffect` |
| `Schema.decodeUnknownEither` | `Schema.decodeUnknownExit` |
| `Schema.encodeUnknownEither` | `Schema.encodeUnknownExit` |
| `Schema.decodeEither` | `Schema.decodeExit` |
| `Schema.encodeEither` | `Schema.encodeExit` |
| `Schema.decode` | `Schema.decodeEffect` |
| `Schema.encode` | `Schema.encodeEffect` |

Object-form `Schema.decode({ … })` transforms are not flagged.

## Effect.fn / gen

### `effect/bn-prefer-effect-fn`

Prefer `Effect.fn("name")` over a function that **returns** `Effect.gen`. Do not wrap `Effect.gen` in a plain function. Vitest `it.effect` callbacks are excluded.

```ts
// good
export const loadUser = Effect.fn('loadUser')(function* (id: string) {
  return yield* findUser(id)
})
```

### `effect/bn-require-effect-fn-name`

`Effect.fn` must take a string span name. It should match the binding (`loadUser` or `users.loadUser`).

### `effect/bn-no-pipe-on-effect-fn`

Do not `.pipe` the result of `Effect.fn(...)(...)`. Pass extra combinators as extra arguments to `Effect.fn`.

### `effect/bn-no-try-catch-in-effect-gen`

Disallow `try/catch` inside `Effect.gen` / `Effect.fn` generators. Use Effect error combinators.

### `effect/bn-no-throw-in-effect-gen`

Disallow `throw` inside those generators. Use `return yield* Effect.fail(...)` or `Schema.TaggedError`.

### `effect/bn-require-return-yield-on-fail`

Fail with `return yield*` so TypeScript narrows the rest of the generator (`yield* Effect.fail` without `return` is flagged).

### `effect/bn-no-yield-ref-handle`

Do not `yield*` a `Ref` / `Fiber` / `Deferred` **handle**. Use `Ref.get`, `Fiber.join`, `Deferred.await`.

## Schema / errors / time

### `effect/bn-schema-union-array`

`Schema.Union`, `Tuple`, `TemplateLiteral` take an **array**. Multi `Schema.Literal` → `Schema.Literals([...])`.

```ts
Schema.Union([A, B])
Schema.Literals(['a', 'b'])
```

### `effect/bn-schema-no-legacy-filter`

Disallow v3 Schema methods: `filter`, `optionalWith`, `positive`, `negative`, `nonNegative`, `nonPositive`, `pattern`, plus exports `nonEmptyString`.

Prefer `Schema.check` / `Schema.refine` / `Schema.optionalKey` / `Schema.String.check(Schema.isNonEmpty())`.

### `effect/bn-prefer-date-from-string`

`Schema.Date` is `Date` instances in v4. ISO strings → `Schema.DateFromString`. `Schema.DateFromNumber` → `Schema.DateFromMillis`.

### `effect/bn-prefer-schema-tagged-error`

**Tests skipped.** Prefer `Schema.TaggedError` over `class X extends Error`, `Data.TaggedError`, and `Effect.fail(new Error(...))`.

### `effect/bn-prefer-predicate`

**Tests skipped.** Do not write local `isString` / `isObject` / `isNumber` / `isBoolean` / `isUndefined` / `isNull` / `isFunction` / `isDate` / `isPromise` / `isError` / `isNullish` / `isRecord` helpers. Use `Predicate.*`.

### `effect/bn-no-date-now-in-effect`

**Tests skipped.** No `Date.now()` or `new Date()` for “now”. Use `Clock.currentTimeMillis` / `DateTime.now`.

### `effect/bn-prefer-clock-sleep`

**Tests skipped.** Inside generators, prefer `Effect.sleep` over `setTimeout` / `setInterval` so `TestClock` can control time.

### `effect/bn-prefer-try-promise`

**Tests skipped.** Prefer `Effect.tryPromise({ try, catch })`. `Effect.promise` maps rejection to a defect.

## Services / runtime

### `effect/bn-require-service-id-path`

**Tests skipped.** `Context.Service` ids must look like `pkg/dir/Name` (two or more non-empty `/` segments). Not `"Database"`.

### `effect/bn-require-service-static-layer`

**Tests skipped.** `Context.Service` classes need `static readonly layer` (or `options.make`). v4 has no `.Default`.

### `effect/bn-prefer-service-of`

**Tests skipped.** Return `Database.of({ ... })`, not a plain object, when implementing a `Context.Service`.

### `effect/bn-no-run-promise-in-modules`

**Tests skipped.** Keep `Effect.runPromise` / `runSync` / `runFork` / `runCallback` (and `*With` / `*Exit` variants) at process entry files.

| Option | Default |
| --- | --- |
| `entry` | `['/main.ts', '/server.ts', '/index.ts', '/app.ts', '/runtime.ts']` |
| `allow` | `[]` |

Prefer `NodeRuntime.runMain` / `BunRuntime.runMain` / `Layer.launch` / `ManagedRuntime` at the edge.

## Tests

### `effect/bn-no-it-effect-scoped`

Do not wrap `it.effect` / `it.live` in `Effect.scoped` (already scoped). `it.scopedLive` is removed → `it.live`.

### `effect/bn-prefer-effect-vitest`

**Test files only.** If a bare `it` / `test` callback returns an Effect, use `it.effect` from `@effect/vitest`.
