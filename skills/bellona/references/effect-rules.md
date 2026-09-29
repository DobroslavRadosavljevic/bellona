# bellona/effect rules

Plugin name: `bl-effect`. Ids: `bl-effect/<slug>`. Target **Effect v4** (`effect@rc`, currently `4.0.0-rc.115`). Do not mix v3 APIs.

**Skip (all):** files that do not import `effect`, `effect/…`, or `@effect/…`, and `allow` matches.

**Also skip tests** (style rules): marked **tests skipped** below.

**Tests only:** `bl-effect/prefer-vitest`.

Bindings follow namespace and named imports (`Effect.fn` and `import { fn } from 'effect/Effect'`). See [how-it-works.md](how-it-works.md).

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## v3 → v4

### `bl-effect/no-v3-imports`

Disallow moved v3 specifiers. Exact map (partial):

| From | To |
| --- | --- |
| `effect/Either` | `effect/Result` |
| `effect/FiberRef` | `effect/References` |
| `effect/JSONSchema` | `effect/JsonSchema` |
| `effect/TestClock` | `effect/testing/TestClock` |
| `effect/FastCheck` | `fast-check` (Schema generation: `effect/unstable/arbitrary`) |
| `effect/ParseResult` | `effect/SchemaIssue` (parsers: `effect/SchemaParser`) |
| `effect/SchemaError` | `effect/Schema` (`Schema.SchemaError` / `Schema.isSchemaError`) |
| `effect/testing/FastCheck` | `fast-check` |
| `effect/TRef` (and other `T*`) | `effect/TxRef` (`Tx*`) |
| `@effect/platform/HttpClient` (and HttpServer/Router) | `effect/unstable/http` |
| `@effect/platform/HttpApi*` | `effect/unstable/httpapi` |
| `@effect/sql/*` | `effect/unstable/sql` |
| `@effect/cli/*` | `effect/unstable/cli` (`Args` → `Argument`, `Options` → `Flag`) |
| `@effect/rpc/*` | `effect/unstable/rpc` |
| `@effect/cluster/*` | `effect/unstable/cluster` |
| `@effect/workflow/*` | `effect/unstable/workflow` |
| `@effect/ai/*` | `effect/unstable/ai` |
| `@effect/opentelemetry/Otlp*` | `effect/unstable/observability` |
| `effect/Mailbox` | `effect/Queue` |
| `effect/unstable/encoding/Msgpack` | `effect/unstable/encoding/SchemaBinary` |
| `@effect/platform/FileSystem` | `effect/FileSystem` |
| `@effect/platform/Path` | `effect/Path` |
| `@effect/platform/Command` / `CommandExecutor` | `effect/unstable/process` |
| `@effect/platform/Socket` / `SocketServer` | `effect/unstable/socket` |
| `@effect/platform/Worker*` / `Transferable` | `effect/unstable/workers` |
| `@effect/platform/Ndjson` | `effect/unstable/encoding` |
| `@effect/platform/MsgPack` | `effect/unstable/encoding/SchemaBinary` |
| `@effect/platform/OpenApi` | `effect/unstable/httpapi` |
| `@effect/typeclass/Semigroup` / `Monoid` | `effect/Combiner` / `effect/Reducer` |

Current v4 packages are **not** flagged: `effect`, `effect/…`, `@effect/vitest`, `@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`, `@effect/atom-*`, `@effect/opentelemetry` (SDK, not the old Otlp helpers).

### `bl-effect/no-v3-apis`

| Old | New |
| --- | --- |
| `Effect.catchAll` | `Effect.catch` |
| `Effect.catchAllCause` | `Effect.catchCause` |
| `Effect.catchAllDefect` | `Effect.catchDefect` |
| `Effect.catchSome` | `Effect.catchFilter` |
| `Effect.catchSomeCause` | `Effect.catchCauseFilter` |
| `Effect.catchSomeDefect` | `Effect.catchDefect` (die again for defects you do not handle) |
| `Effect.async` / `asyncEffect` | `Effect.callback` |
| `Effect.either` | `Effect.result` |
| `Effect.zipRight` | `Effect.andThen` |
| `Effect.zipLeft` | `Effect.tap` |
| `Effect.fork` | `Effect.forkChild` |
| `Effect.forkDaemon` | `Effect.forkDetach` |
| `Effect.forkAll` | `Effect.forEach` + `Effect.forkChild` |
| `Effect.forkWithErrorHandler` | `Effect.forkChild` + `Fiber.await` |
| `Effect.tapErrorCause` | `Effect.tapCause` |
| `Effect.ignoreLogged` | `Effect.ignore({ log: true })` |
| `Effect.optionFromOptional` | `Effect.catchNoSuchElement` |
| `Effect.makeSemaphore` / `unsafeMakeSemaphore` | `Semaphore.make` / `Semaphore.makeUnsafe` |
| `Effect.makeLatch` / `unsafeMakeLatch` | `Latch.make` / `Latch.makeUnsafe` |
| `Effect.dieMessage` | `Effect.die(new Error(message))` |
| `Layer.scoped*` | `Layer.effect*` |
| `Layer.catchAll` | `Layer.catch` |
| `Layer.tapErrorCause` | `Layer.tapCause` |
| `Stream.async` / `asyncEffect` / `asyncPush` / `asyncScoped` | `Stream.callback` |
| `Stream.repeatEffect` / `repeatEffectWithSchedule` / `repeatEffectChunk` | `Stream.fromEffectRepeat` / `fromEffectSchedule` / `fromIterableEffectRepeat` |
| `Stream.*Chunk*` (`fromChunk`, `mapChunks`, `flattenChunks`, …) | `Stream.*Array*` (`fromArray`, `mapArray`, `flattenArray`, …) |
| `Stream.either` / `mergeEither` | `Stream.result` / `mergeResult` |
| `Stream.catchAll` / `catchAllCause` / `tapErrorCause` | `Stream.catch` / `catchCause` / `tapCause` |
| `Stream.catchSome` / `catchSomeCause` | `Stream.catchFilter` / `catchCauseFilter` |
| `Scope.extend` | `Scope.provide` |
| `Schema.DateFromSelf` | `Schema.Date` (the v4 schema for `Date` instances; use `Schema.DateFromString` for ISO strings) |
| `Schema.DateFromNumber` | `Schema.DateFromMillis` |
| `Predicate.isRecord` | `Predicate.isObject` |
| `Predicate.isObject` (v3 arrays + functions) | `Predicate.isObjectKeyword` |
| `Predicate.isNullable` | `Predicate.isNullish` |
| `Predicate.isNotNullable` | `Predicate.isNotNullish` |
| `Predicate.isReadonlyRecord` | `Predicate.isReadonlyObject` |

### `bl-effect/no-v3-service-tags`

Disallow `Context.Tag`, `GenericTag`, `Effect.Tag`, `Effect.Service`. Use `Context.Service`.

### `bl-effect/prefer-decode-unknown`

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

In v4, `Schema.decode` / `Schema.encode` take a transformation (`Schema.decode({ decode, encode })`, `Schema.decode(SchemaTransformation.trim())`). The rule flags them only when the argument is a schema: a `Schema.*` value or a PascalCase name such as `User`. A lowercase variable is taken as a transformation.

## Effect.fn / gen

### `bl-effect/prefer-fn`

Prefer `Effect.fn("name")` over a function that **returns** `Effect.gen`. `Effect.fnUntraced` is valid for library and hot-path code with no span. Do not wrap `Effect.gen` in a plain function. Vitest `it.effect` callbacks are excluded.

```ts
// good
export const loadUser = Effect.fn('loadUser')(function* (id: string) {
  return yield* findUser(id)
})
```

### `bl-effect/require-fn-name`

`Effect.fn` must take a string span name. It should match the binding (`loadUser` or `users.loadUser`). `Effect.fn` without a name makes no span. If you do not need a span, use `Effect.fnUntraced`.

A factory that makes many functions can use a template literal. The name must start with a fixed owner, such as ``Effect.fn(`Tools.${name}`)``. When the function has a binding, the template must end with it: ``reserve: Effect.fn(`Steps.${tool}.reserve`)``.

### `bl-effect/no-floating-effect`

Inside an `Effect.gen` / `Effect.fn` generator, a statement that makes an Effect and does not `yield*` it never runs. The rule flags `Effect.<x>(…)` statements and `.pipe(…)` chains on them, plus `Ref.set` / `Ref.update` / `Deferred.succeed` / `Fiber.interrupt` and similar handle operations. Runners (`Effect.runFork`, a pipe that ends in a runner) and `Effect.fn` factories are not flagged. Nested plain functions are not checked.

```ts
yield* Effect.log('x') // not: Effect.log('x')
```

### `bl-effect/no-return-effect-in-gen`

Inside an Effect generator, `return Effect.fail(e)` returns the Effect as the success value. It does not fail. Write `return yield* Effect.fail(e)`. For `Effect.succeed(value)`, return `value`. `Effect.fn` factories, runners, and values such as `Service.of({ … })` are not flagged.

### `bl-effect/require-fn-owner-prefix`

Inside a class that extends `Context.Service`, every string or template `Effect.fn` name must start with `ClassName.` (`Effect.fn("Mailer.send")`, ``Effect.fn(`Mailer.${step}`)``). A helper inside a method uses `ClassName.method.helper`. Unnamed `Effect.fn`, `Effect.fnUntraced`, and functions outside a service class are not checked.

### `bl-effect/prefer-fn-untraced-in-callbacks`

An applied `Effect.fn("name")(…)` that is passed straight into a call (`Effect.forEach`, `Stream.mapEffect`, `Effect.catch*`, `db.transaction`, …) makes a span for each item or error. Use `Effect.fnUntraced`. A named binding (`const load = Effect.fn("load")(…)`) and a service member are not flagged.

| Option | Default |
| --- | --- |
| `callees` | `['Command.make', 'Command.withHandler']` (CLI handlers run once) |
| `allow` | `[]` |

A `callees` entry matches the full dotted callee (`HttpRouter.add`) or its last part (`get`). A custom list replaces the default list.

### `bl-effect/no-service-make-factory`

`Layer.effect(Service, make)` or `Layer.effect(Service, make(options))` builds the service in a separate factory. Build it inline: `Layer.effect(Service, Effect.gen(function* () { … return Service.of({ … }) }))`. Allowed: inline `Effect.*` calls, members such as `this.make` / `Service.make` / `PgClient.make(…)`, named `effect` imports such as `gen`, and helpers that the same file exports (shared with other modules).

### `bl-effect/require-promise-abort-signal`

`Effect.tryPromise` / `Effect.promise` give the Promise function an `AbortSignal` that Effect aborts on interruption. A Promise function with no parameter that calls `fetch` cannot stop the request. Write `try: (signal) => fetch(url, { signal })`. For a timeout, use `AbortSignal.any([signal, AbortSignal.timeout(ms)])`. Only calls directly in the Promise function are checked.

| Option | Default |
| --- | --- |
| `apis` | `['fetch']` (full dotted name, or `globalThis.<name>`) |
| `allow` | `[]` |

### `bl-effect/no-status-in-tagged-error`

A domain error should not choose its HTTP status. Map the tag to a status at the route. The rule flags a fixed `status` / `statusCode` / `httpStatus` on `Schema.TaggedError`, `Schema.Error`, `Data.TaggedError`, and `Data.Error` classes: `Schema.Literal(404)` fields, `readonly status = 404` class properties, and `{ status: 404 }` type fields. A field that records the status an upstream API sent (`status: Schema.Number`) is data and is allowed.

### `bl-effect/no-try-catch-in-gen`

Disallow `try/catch` and `try/finally` inside `Effect.gen` / `Effect.fn` generators. A failed `yield*` does not throw into the generator, so `catch` never gets `Effect.fail` errors. When a `yield*` fails or the fiber is interrupted, `finally` does not run. Use `Effect.catch*` and `Effect.try` for errors. Use `Effect.ensuring` / `Effect.onExit` / `Effect.acquireRelease` for cleanup.

### `bl-effect/no-throw-in-gen`

Disallow `throw` inside those generators. A `throw` becomes a defect, not a typed error. Use `return yield* Effect.fail(...)` or `return yield* new NotFound({ … })` (a `Schema.TaggedError` class).

### `bl-effect/require-gen-self-options`

Class methods must use `Effect.gen({ self: this }, function* () { … })`. Do not pass a bare `this` as the first argument.

### `bl-effect/require-return-yield-on-fail`

Fail with `return yield*` so TypeScript narrows the rest of the generator. The rule flags `yield* Effect.fail(...)` (also `failSync`, `failCause`, `failCauseSync`, `die`, and a `new XError()`) as a statement or as a whole initializer. A fail inside a value, such as `row ?? (yield* new NotFound())` or `ok ? value : yield* fail`, is allowed.

### `bl-effect/no-yield-ref-handle`

Do not `yield*` a `Ref` / `Fiber` / `Deferred` **handle**. Use `Ref.get`, `Fiber.join`, `Deferred.await`. In v4 these handles are not Effects and not `Yieldable`, so TypeScript also rejects `yield* ref`.

### `bl-effect/require-fn-return-annotation`

**Tests skipped.** An exported top-level `Effect.fn` / `Effect.fnUntraced` generator must have a return type. The rule checks `export const x = …`, `export { x }`, and `export default …`. Write `Effect.fn.Return<A, E, R>`, as in the Effect `LLMS.md`:

```ts
export const loadUser = Effect.fn('loadUser')(function* (
  id: string,
): Effect.fn.Return<User, UserNotFound, Database> {
  return yield* findUser(id)
})
```

Service methods in `Service.of({ … })` are not checked. The service contract gives them their types.

## Schema / errors / time

### `bl-effect/schema-union-array`

`Schema.Union`, `Tuple`, `TemplateLiteral` take an **array**. Multi `Schema.Literal` → `Schema.Literals([...])`.

```ts
Schema.Union([A, B])
Schema.Literals(['a', 'b'])
```

### `bl-effect/schema-no-legacy-filter`

Disallow v3 Schema methods: `filter`, `filterEffect`, `optionalWith`, `positive`, `negative`, `nonNegative`, `nonPositive`, `pattern`, `rename`, plus exports `nonEmptyString`, `encodedSchema`, `typeSchema`, `encodedBoundSchema`, `toArbitrary`, `UUID`, `ULID`, and the v3 filters `int`, `finite`, `greaterThan`, `greaterThanOrEqualTo`, `lessThan`, `lessThanOrEqualTo`, `between`, `multipleOf`, `minLength`, `maxLength`.

Methods count only on a schema (`Schema.String`, `Schema.Array(item)`, or a `.pipe` / `.check` / `.annotate` chain on one). Data from a schema, such as `Schema.Literals([...]).literals.filter(...)`, is not flagged.

Prefer `Schema.check(Schema.makeFilter(predicate))` / `Schema.refine` / `Schema.check(Schema.isInt())` / `Schema.optionalKey` / `Schema.encodeKeys` / `Schema.toEncoded` / `Schema.toType` / `Schema.String.check(Schema.isNonEmpty())`.

### `bl-effect/prefer-schema-tagged-error`

**Tests skipped.** Prefer `Schema.TaggedError` over `class X extends Error`, `Data.TaggedError`, and `Effect.fail(new Error(...))`.

### `bl-effect/prefer-predicate`

**Tests skipped.** Do not write local `isString` / `isObject` / `isNumber` / `isBoolean` / `isUndefined` / `isNull` / `isFunction` / `isDate` / `isPromise` / `isError` / `isNullish` / `isRecord` helpers. Use `Predicate.*`. A local `isRecord` is `Predicate.isObject`. v3 `Predicate.isObject` (arrays and functions) is `Predicate.isObjectKeyword`.

### `bl-effect/no-date-now`

**Tests skipped.** No `Date.now()` or `new Date()` for “now”. Use `Clock.currentTimeMillis` / `DateTime.now`.

### `bl-effect/prefer-clock-sleep`

**Tests skipped.** Inside generators, prefer `Effect.sleep` over `setTimeout` / `setInterval` so `TestClock` can control time.

### `bl-effect/prefer-try-promise`

**Tests skipped.** Prefer `Effect.tryPromise({ try, catch })`. `Effect.promise` maps rejection to a defect.

## Services / runtime

### `bl-effect/require-service-filename`

Files that define `Context.Service` must end with `.service.ts`.
This includes class and value forms, named import aliases, and namespace imports.
Files that only import or use a service do not need this suffix.
Test files are checked. Use `allow` for explicit exceptions.

### `bl-effect/max-services`

Allow at most one `Context.Service` definition per file.
Class and value forms count. A class factory counts once.
The rule reports the second definition. Move each extra service into its own file.
Test files are checked. Use `allow` for explicit exceptions.

### `bl-effect/require-service-id-path`

**Tests skipped.** `Context.Service` ids must look like `pkg/dir/Name` (two or more non-empty `/` segments). Not `"Database"`.

### `bl-effect/require-service-static-layer`

**Tests skipped.** `Context.Service` classes need `static readonly layer`. v4 has no `.Default`. `options.make` only stores the constructor Effect on the class and does not make a layer, so a class with `make` also needs `static readonly layer = Layer.effect(this, this.make)`.

### `bl-effect/prefer-service-of`

**Tests skipped.** Return `Database.of({ ... })`, not a plain object, when implementing a `Context.Service` in `Layer.effect`, `Layer.sync`, or `Layer.succeed`. `.of` returns its argument. It checks the object against the service shape where you write it. Arrow bodies (`() => ({ … })`) count as returns. Nested method, helper, and transaction callback returns are not flagged.

### `bl-effect/effect-functions-in-services`

**Tests skipped.** Capabilities are services; pure logic may stay plain. In a file that is not a service file, a module-level function, `Effect.fn` / `fnUntraced` value, or `Effect.gen` value that gets a service (`yield* X`, `X.use(…)`, `X.useSync(…)`, `Effect.service(X)`, also in nested code) must become a method of the owning `Context.Service`. A function that runs the Effect itself (`runtime.runPromise`, `Effect.runFork`) is an edge adapter and is not flagged.

A name is a service when it is a PascalCase import from a path that ends in `.service` / `.service.ts` (a namespace import also counts: `Db.Database`), a PascalCase import from a `servicePackages` package, a same-file `Context.Service` / `Context.Reference` class or `Context.Service(…)` value, or a name in `services`.

| Option | Default |
| --- | --- |
| `serviceFiles` | `['.service.ts']` (filename suffixes that are skipped) |
| `serviceSources` | `['.service', '.service.ts']` (import path suffixes) |
| `servicePackages` | `[]` (for example `['@app/redis']`) |
| `services` | `[]` |
| `boundaries` | `['/routes/', '/live.ts', '/runtime.ts', '/server/', '/testing/', '/scripts/', '/src/index.ts', '/src/main.ts']` (path parts that are skipped) |
| `allow` | `[]` |

### `bl-effect/max-service-methods`

A `Context.Service` with more than `max` members does too many jobs. Split it by capability. The rule counts the contract type (a type literal, or a same-file `interface` / `type`). When the contract is not in the file, it counts the largest `Service.of({ … })` object in the class. On a real backend with 119 services, the median was 2 members, p90 5, p95 7, and the largest 20.

| Option | Default |
| --- | --- |
| `max` | `10` |
| `allow` | `[]` |

### `bl-effect/no-run-promise-in-modules`

**Tests skipped.** Keep `Effect.runPromise` / `runSync` / `runFork` / `runCallback` (and `*With` / `*Exit` variants) at process entry files.

| Option | Default |
| --- | --- |
| `entry` | `['/main.ts', '/server.ts', '/index.ts', '/app.ts', '/runtime.ts']` |
| `allow` | `[]` |

Prefer `NodeRuntime.runMain` / `BunRuntime.runMain` / `Layer.launch` / `ManagedRuntime` at the edge.

### `bl-effect/no-inferred-service-contract`

**Tests skipped.** A `Context.Service<Self, Shape>` shape must be a written contract. The rule flags a shape that is `Effect.Success<typeof x>`, `Effect.Success<ReturnType<typeof x>>`, or `ReturnType<typeof make…>`. It also finds these types inside the shape (`Omit<Effect.Success<typeof make>, 'close'>`) and in a local type alias that the shape uses. `ReturnType<typeof createClient>` for a third-party client is allowed.

### `bl-effect/no-forwarding-service`

**Tests skipped.** Do not add a service that only forwards calls. Call the operation owner directly. The rule reports the class one time when each member of its `Service.of({ … })` object in a static member forwards. A member forwards when it only calls a method of a local value with the same parameters in the same order:

- `find: repo.find`
- `find: (id) => repo.find(id)` or a method `find(id) { return repo.find(id) }`
- `find: Effect.fn("Users.find")(function* (id) { return yield* repo.find(id) })`
- `...repo`

A service with one or more members that do real work is allowed. Calls on imports (`Effect.succeed(value)`) and on `this` are not forwards.

### `bl-effect/no-per-call-cache-construction`

**Tests skipped.** Build a cache one time, in the layer. The rule flags `Cache.make`, `Cache.makeWith`, `ScopedCache.make`, `ScopedCache.makeWith`, `RcMap.make`, `Effect.cached`, `Effect.cachedWithTTL`, and `Effect.cachedInvalidateWithTTL` inside a function that runs for each call:

- an `Effect.fn` / `Effect.fnUntraced` body, or a function inside one;
- a method in a `Service.of({ … })` object.

Direct calls in the `Layer.effect` generator and at module level are allowed.

### `bl-effect/no-module-level-mutable-state`

**Tests skipped.** In a file that imports `effect`, a module-level `let` / `var` that the code writes again is shared state that no layer owns. Keep it in a `Ref` that a layer makes. A `let` that the code never writes again, and a `declare let`, are not flagged. CLI scripts often keep a flag at module level. Add their folder to `allow` (for example `['/scripts/']`).

### `bl-effect/no-duplicate-layer-construction`

**Tests skipped.** Effect v4 shares a layer only when it is the same object (`effect/migration/layer-memoization.md`). The same parameterized layer call written two or more times in one file makes two objects. Then the runtime builds two pools or two connections. Store the call one time in a module-level constant.

A layer call has one or more arguments and its callee is one of these:

- a member that starts with `layer` or ends with `Layer`: `PgClient.layer({ url })`, `Http.layerConfig(…)`, `Redis.makeLayer(…)`;
- an identifier that starts with `layer` or ends with `Layer`: `redisLayer("cache")`;
- a `Layer` constructor: `effect`, `effectContext`, `effectDiscard`, `sync`, `syncContext`, `suspend`, `unwrap`, `fromBuild`.

The rule compares the call text without whitespace. `Layer.provide`, `Layer.merge`, and other combinators are not checked, because the layers that they wrap keep their identity.

### `bl-effect/require-redacted-secret-config`

**Tests skipped.** A config key whose name looks like a secret must use `Config.Redacted`. The rule checks `Config.String(key)`, `Config.NonEmptyString(key)`, and `Config.schema(schema, key)` (the v4 names). A key can be a string or a path array. `Config.schema(Schema.Redacted(…), key)` is allowed.

| Option | Default |
| --- | --- |
| `pattern` | `'(KEY\|TOKEN\|SECRET\|PASSWORD\|PASS\|PRIVATE\|CREDENTIAL)'` (matched without case) |
| `allow` | `[]` |

### `bl-effect/require-timeout-on-external-io`

**Opt-in. This rule is noisier than the others.** **Tests skipped.** Only `.service.ts` files are checked. Inside an `Effect.fn` / `Effect.fnUntraced` body, `Effect.tryPromise` and `HttpClient` calls (`execute`, `get`, `post`, `put`, `patch`, `del`, `head`, `options`, on the module or on a `yield* HttpClient.HttpClient` client) need a timeout. The rule accepts these timeouts:

- `Effect.timeout`, `Effect.timeoutOption`, or `Effect.timeoutOrElse` in the same pipe chain or as a data-first wrapper (v4 has no `timeoutFail`);
- a timeout in the extra arguments of the `Effect.fn`: `Effect.fn("name")(function* () { … }, Effect.timeout("10 seconds"))`;
- a caller in the same file that adds a timeout: `request(url).pipe(Effect.timeoutOrElse(…))` or `finish(request(url))`, when `finish` applies a timeout;
- a helper in the same file that applies a timeout, or a name in `helpers`;
- a Promise function that sets its own timeout: `AbortSignal.timeout(…)`, or a `timeout` / `timeoutMs` option.

A Promise function that calls a local API (file system calls, `Bun.write`) is not checked. A Promise function with no call, `new`, or tagged template is not checked either. It only reads a promise that already exists, such as `() => result.finishReason` or `async () => await pending`, so it starts no work. The timeout belongs to the code that made that promise. `() => fetch(url)` and `() => client.get()` are still checked. Calls in a nested `Effect.gen` or in a callback are not checked.

| Option | Default |
| --- | --- |
| `helpers` | `[]` (full dotted name or last part, for example `withRequestTimeout`) |
| `localApis` | `readFile`, `writeFile`, `appendFile`, `mkdir`, `mkdtemp`, `rm`, `rmdir`, `unlink`, `rename`, `copyFile`, `readdir`, `stat`, `lstat`, `access`, `Bun.write`, `Bun.file` |
| `allow` | `[]` |

A custom `localApis` list replaces the default list. Add project functions that do only CPU work, such as image, PDF, or email rendering.

## Failures, fibers, and resources

### `bl-effect/no-silent-catch-cause`

**Tests skipped.** A catch handler that ignores its parameter and returns a fixed success (`Effect.succeed(x)`, `Effect.void`, `Effect.succeedNone`, `Effect.as(Effect.void, x)`) hides the failure. `Effect.catchCause` also catches defects (bugs) and interruptions, and `Effect.catchDefect` catches defects. Log the cause first, or catch only the expected error with `Effect.catchTag`. A handler with other statements, or one that uses its parameter, is not flagged.

| Option | Default |
| --- | --- |
| `apis` | `['catchCause', 'catchDefect']` (add `catch`, `catchTag`, `catchTags` to check typed catchers too) |
| `allow` | `[]` |

### `bl-effect/require-ignore-log`

**Tests skipped.** `Effect.ignore` / `Effect.ignoreCause` with no `log` option drops the failure with no trace. Write `Effect.ignore({ log: "Warn", message: "… failed" })` (`log` takes `true` or `"Debug"` / `"Info"` / `"Warn"` / `"Error"`). Not flagged: cleanup arguments (`Effect.addFinalizer`, `ensuring`, `onExit`, `onInterrupt`, `onError`, the release of `acquireRelease`, `acquireUseRelease`, `Scope.addFinalizer*`), `Scope.close(…)` results, and a pipe that already runs `Effect.tapError` / `tapCause` / `tapErrorTag` / `tapDefect` before `ignore`.

| Option | Default |
| --- | --- |
| `allowInFinalizers` | `true` |
| `allow` | `[]` |

### `bl-effect/no-fork-detach`

**Tests skipped.** `Effect.forkDetach` starts a fiber that no scope owns, so shutdown does not stop it. Allowed only in entry files (same `entry` option as `no-run-promise-in-modules`). The rule also flags `Effect.forkChild` directly in the generator that builds a `Layer.effect` / `effectDiscard` / `effectContext`: the child is interrupted as soon as the layer is built. Use `Effect.forkScoped`.

### `bl-effect/require-defect-cause`

A `cause` field of `Schema.TaggedError` / `Schema.Error` typed `Schema.Unknown` or `Schema.Any` (also inside `optional`, `optionalKey`, `NullOr`, `UndefinedOr`, `NullishOr`) encodes an `Error` as `{}`. Use `cause: Schema.Defect()`, which encodes `{ name, message }` and decodes back to an `Error`.

### `bl-effect/no-new-error-in-effect`

**Tests skipped.** A plain `Error` must not become a typed failure. The rule flags `new Error(…)` / `Error(…)` as an `Effect.fail` / `Cause.fail` / `Exit.fail` / `Deferred.fail` argument, or as the result of a `catch` function of `Effect.try` / `Effect.tryPromise`, or of `Effect.failSync` / `mapError` / `mapBoth` / `filterOrFail` / `Stream.mapError`. Use a `Schema.TaggedError` class. `Effect.die(new Error(…))` and the other `die` forms are allowed, and so are plain throws in helpers.

### `bl-effect/require-bounded-retry`

`Effect.retry` / `Stream.retry` with an unbounded schedule (`Schedule.exponential`, `spaced`, `fixed`, `fibonacci`, `forever`, `windowed`) and no bound can retry forever. Bounds: `Schedule.recurs`, `upTo`, `during`, `while`, or the options `times` / `until` / `while`. The rule follows `pipe` chains and same-file `const`s. `Schedule.max([a, b])` is bounded when any member is; `Schedule.min` and `Schedule.concat` are bounded only when every member is. A schedule from another module is not checked.

| Option | Default |
| --- | --- |
| `checkRepeat` | `false` (set `true` to check `Effect.repeat` / `Stream.repeat` too) |
| `allow` | `[]` |

### `bl-effect/require-bounded-concurrency`

`concurrency: "unbounded"` on `Effect.all`, `Effect.forEach`, `Stream.mergeAll`, `Stream.mapEffect`, or `Stream.flatMap` starts one fiber for each item. It is allowed only for a fixed list: an array or object literal without spread, a same-file `const` bound to one, or `Object.values` / `keys` / `entries` of a fixed object. Stream calls are always flagged.

### `bl-effect/no-eager-acquire`

`Effect.acquireRelease(Effect.succeed(new Client()), …)` builds the resource before the Effect runs, so an interrupt or a skipped run leaks it. The rule also follows a same-file `const` for the acquire Effect and for the value. Use `Effect.sync(() => new Client())` or `Effect.tryPromise(…)`.

### `bl-effect/no-interpolated-log-message`

**Tests skipped.** The first argument of `Effect.log`, `logTrace`, `logDebug`, `logInfo`, `logWarning`, `logError`, `logFatal`, or `Effect.logWithLevel(level)` must be a fixed message. The rule flags a template literal with `${…}` and a `+` that joins text with a value. Give values as data arguments or with `Effect.annotateLogs`, so logs group and search well:

```ts
yield* Effect.logError('Billing job failed', { job: name }, cause) // not: `Billing job ${name} failed`
```

### `bl-effect/no-log-and-rethrow`

**Tests skipped.** Log a failure one time, at the boundary that handles it. The rule flags `Effect.tapError`, `Effect.tapCause`, `Effect.tapErrorTag`, and `Effect.tapDefect` when the handler only logs (`Effect.log*`) and:

- the tap is in a pipe inside a traced `Effect.fn("…")` body, or is an extra argument of `Effect.fn("…")(…)`;
- no later step in the chain handles the error.

These later steps handle the error, so the log is allowed: `catch*`, `orElse*`, `ignore*`, `option`, `result`, `exit`, `match*`, `mapError`, `mapBoth`, `retry*`, `sandbox`, `flip`.

The span of `Effect.fn("…")` already records the failure, and each caller can log it again. The trade-off: a log that adds fields to the failure is useful. Use `Effect.annotateCurrentSpan` for those fields, or map the error after the log.

| Option | Default |
| --- | --- |
| `tracedOnly` | `true`. Set `false` to also check taps outside traced functions ("log once, at the boundary"). This finds more cases and more false positives. |
| `allow` | `[]` |

## Tests

### `bl-effect/no-it-scoped`

Do not wrap `it.effect` / `it.live` in `Effect.scoped` (already scoped). `it.scopedLive` is removed → `it.live`.

### `bl-effect/no-effect-run-in-tests`

**Test files only.** Do not call `Effect.run*` or `ManagedRuntime.make` in tests. Use `it.effect("name", () => Effect.gen(…))`, and `layer(AppLayer)` / `it.layer(AppLayer)` for shared services.

### `bl-effect/prefer-vitest`

**Test files only.** If a bare `it` / `test` callback returns an Effect, use `it.effect` from `@effect/vitest`. A callback that returns `Effect.runPromise(...)` or `Effect.runSync(...)` is allowed, because it returns a Promise or a value.
