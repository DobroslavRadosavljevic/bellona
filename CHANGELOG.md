# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Oxlint JS plugins are alpha (outside Oxlint semver). A bellona minor may need a matching `oxlint` 1.78 pin.

## [Unreleased]

## [0.5.0] - 2026-09-30

### Upgrade notes

This release removes and renames rules. Update your Oxlint config before you upgrade. Oxlint reports an unknown rule id as a config error.

- **Rename:** `bl-react/no-namespace` is now `bl-react/no-react-namespace`.
- **Remove these ids:**
  - `bl-js/max-classes`, `bl-js/no-reflect-get`, `bl-js/no-reflect-apply`, `bl-js/no-conditional-empty-object-spread`.
  - `bl-effect/no-pipe-on-fn`, `bl-effect/prefer-date-from-string`.
  - `bl-tanstack-router/no-hooks-in-route-lifecycle`, `bl-tanstack-router/require-params-with-path-tokens`, `bl-tanstack-router/require-validate-search-when-used`.
  - `bl-elysia/no-controller-context-class`, `bl-elysia/no-route-factory`.

  The Removed section gives the replacement for each one.

- **Stricter:** `bl-effect/require-service-static-layer` now requires `static readonly layer` also when the class sets `options.make`.
- **Narrower:** `bl-tanstack-router/require-hook-from` now checks only `useNavigate`.
- **New defaults:** new rules ship off, as before. Turn them on by id.

### Added

**TanStack Query**

- `bellona/tanstack-query`: nine opt-in rules for current QueryClient methods, imports, query context, results, and removed options, plus `stable-query-client`, `no-rest-destructuring`, `no-unstable-deps`, and `exhaustive-deps`.
- A source-backed TanStack Query migration guide, with behavior changes and detection limits for version 5.103.2.
- `bl-tanstack-query/no-deprecated-imports` also reports `isCancelledError` and `isServer`.

**TanStack Router**

- `bl-tanstack-router/no-deprecated-apis`: report TanStack Router and Start APIs that are marked `@deprecated` in 1.170, such as `redirect({ code })`, `parseParams`, loader-context `navigate`, `startTransition`, `new RouteApi()`, and `.inputValidator()`.
- `bl-tanstack-router/no-whole-search-loader-deps`: report `loaderDeps` that return the whole `search` object.

**Effect**

- `bl-effect/effect-functions-in-services`: in a file that is not a service file, report a module-level function or Effect value that gets a service (`yield* X`, `X.use`, `X.useSync`, `Effect.service(X)`). Make it a method of the owning `Context.Service`. Route, runtime, server, testing, and script paths, tests, and functions that run the Effect themselves are skipped. Options `serviceFiles`, `serviceSources`, `servicePackages`, `services`, `boundaries`.
- `bl-effect/max-service-methods`: report a `Context.Service` with more than `max` members (default 10), counted from the contract type or from `Service.of({ … })`.
- `bl-effect/no-silent-catch-cause`: report a catch handler that ignores the cause and returns a fixed success. It checks `Effect.catchCause` and `Effect.catchDefect` by default, which also catch defects. Option `apis` adds `catch`, `catchTag`, `catchTags`.
- `bl-effect/require-ignore-log`: require `Effect.ignore` / `Effect.ignoreCause` to set `log`. Cleanup code, `Scope.close`, and pipes that already tap the error are allowed. Option `allowInFinalizers` (default `true`).
- `bl-effect/no-fork-detach`: report `Effect.forkDetach` outside entry files (option `entry`), and `Effect.forkChild` in a layer construction generator, where the child stops as soon as the layer is built. Use `Effect.forkScoped`.
- `bl-effect/require-defect-cause`: require `cause: Schema.Defect()` instead of `Schema.Unknown` / `Schema.Any` in `Schema.TaggedError` and `Schema.Error` fields.
- `bl-effect/no-new-error-in-effect`: report a plain `Error` that becomes a typed failure: an `Effect.fail` argument, or a `catch` / `mapError` / `failSync` result. `Effect.die(new Error(…))` is allowed.
- `bl-effect/require-bounded-retry`: require a bound (`Schedule.recurs`, `upTo`, `during`, `while`, or `times`) on `Effect.retry` / `Stream.retry` schedules. Option `checkRepeat` (default `false`) also checks `repeat`.
- `bl-effect/require-bounded-concurrency`: report `concurrency: "unbounded"` in `Effect.all` / `forEach`, `Stream.mergeAll` / `mapEffect` / `flatMap` unless the input is a fixed list.
- `bl-effect/no-eager-acquire`: report `Effect.acquireRelease(Effect.succeed(new X()), …)`, which builds the resource before acquire runs. Use `Effect.sync` or `Effect.tryPromise`.
- `bl-effect/no-effect-run-in-tests`: report `Effect.run*` and `ManagedRuntime.make` in test files. Use `it.effect` and `it.layer`.
- `bl-effect/no-inferred-service-contract`: report a `Context.Service` shape that is inferred with `Effect.Success<typeof …>`, `Effect.Success<ReturnType<typeof …>>`, or `ReturnType<typeof make…>`, also through a local type alias.
- `bl-effect/no-forwarding-service`: report a `Context.Service` class whose `Service.of({ … })` members only forward calls to another service with the same arguments.
- `bl-effect/no-per-call-cache-construction`: report `Cache.make`, `ScopedCache.make`, `RcMap.make`, and `Effect.cached*` inside an `Effect.fn` body or a `Service.of` method. Build the cache in the layer.
- `bl-effect/no-module-level-mutable-state`: report a module-level `let` / `var` that is written again, in files that import effect. Keep the state in a layer-owned `Ref`.
- `bl-effect/no-duplicate-layer-construction`: report the same parameterized layer call written two or more times in one file. Store it in one module-level constant.
- `bl-effect/require-redacted-secret-config`: require `Config.Redacted` when `Config.String`, `Config.NonEmptyString`, or `Config.schema` reads a secret-looking key. Option `pattern`.
- `bl-effect/require-timeout-on-external-io`: opt-in and noisier. In `.service.ts` files, require an `Effect.timeout*` on `Effect.tryPromise` and `HttpClient` calls inside `Effect.fn` bodies. Options `helpers` and `localApis`.
- `bl-effect/no-interpolated-log-message`: report an `Effect.log*` message built with `${…}` or `+`. Use a fixed message plus data or `Effect.annotateLogs`.
- `bl-effect/no-log-and-rethrow`: report `Effect.tapError` / `tapCause` / `tapErrorTag` / `tapDefect` handlers that only log in a traced `Effect.fn` when no later step handles the error. Option `tracedOnly` (default `true`).
- `bl-effect/require-fn-return-annotation`: require `Effect.fn.Return<A, E, R>` on exported top-level `Effect.fn` / `Effect.fnUntraced` generators.
- `bl-effect/no-floating-effect`: report an Effect that a generator makes but does not `yield*`, such as `Effect.log("x")` or `Ref.set(ref, 1)` as a statement.
- `bl-effect/no-return-effect-in-gen`: report `return Effect.fail(e)` inside an Effect generator. Use `return yield*`.
- `bl-effect/require-fn-owner-prefix`: require `Effect.fn` names inside a `Context.Service` class to start with the class name.
- `bl-effect/prefer-fn-untraced-in-callbacks`: prefer `Effect.fnUntraced` over a traced `Effect.fn("…")(…)` passed as a callback. Option `callees` (default `['Command.make', 'Command.withHandler']`).
- `bl-effect/no-service-make-factory`: require `Layer.effect` to build a service inline, not through a separate factory. Exported helpers are skipped.
- `bl-effect/require-promise-abort-signal`: require the `Effect.tryPromise` / `Effect.promise` function to take the `AbortSignal` when it calls `fetch`. Option `apis` (default `['fetch']`).
- `bl-effect/no-status-in-tagged-error`: report a fixed HTTP status on a tagged error class. A status field that records an upstream response is allowed.

**Elysia**

- `bl-elysia/no-elysia-factory-function`: report module-level functions that build `new Elysia(…)` under `directories` (default `/modules/`, `/routes/`).
- `bl-elysia/prefer-eden-treaty-in-tests`: in `*.test.*` / `*.spec.*` files, report `app.handle(new Request(…))`. Use `treaty(app)` from `@elysia/eden`.
- `bl-elysia/status-code-in-response`: report `status(N, …)` from the `elysia` import when the route's inline `response` object has no `N` key.
- `bl-elysia/hook-after-routes`: report local lifecycle hooks (`onBeforeHandle`, `onAfterHandle`, `onTransform`, `onParse`, `derive`, `resolve`, `mapDerive`, `mapResolve`) after the last route of a `new Elysia()` chain.
- `bl-elysia/no-set-redirect`: report the deprecated `set.redirect = url`. Return `redirect(url)`.
- `bl-elysia/no-decorate-singletons`: report `.decorate()` of app singletons (`names`, default `db`, `database`, `runtime`, `redis`, `client`).

**Zod**

- `bl-zod/no-deprecated-v4-apis`: report Zod APIs that zod 4 marks `@deprecated`: the `message` param (use `error`), `.merge()`, `.passthrough()`, `.step()`, `.safe()`, `.finite()`, `.removeDefault()` / `.removeCatch()`, `z.nativeEnum()`, and ZodError `.format()` / `.flatten()`.

**React**

- `bl-react/prefer-context-as-provider`: report `<XContext.Provider>`. React 19 renders `<XContext>` as the provider.
- `bl-react/no-forward-ref`: report `forwardRef` from `react`. In React 19, `ref` is a prop.

**Base UI**

- `bl-base-ui/no-component-as-render`: report a component reference as a `render` value (`render={Link}`). Pass `render={<Link />}` or a render function.

**Tailwind**

- `bl-tailwind/no-v3-arbitrary-var`: report Tailwind v3 class syntax in class positions: `x-[--var]` (use `x-(--var)`), the removed `*-opacity-*` utilities, and the v3 names `flex-shrink-*`, `flex-grow-*`, `overflow-ellipsis`, `decoration-slice`, `decoration-clone`.
- `bl-tailwind/no-dynamic-class-construction`: report class names built at runtime in class positions (`bg-${hue}-500`, `w-[${width}px]`).

**JS / TS**

- `bl-js/require-file-layout`: require files under configured folders (`layouts: [{ root, allow, message? }]`, glob-lite `*` / `**`) to sit in allowed places. A file directly in a `services` folder must be a `*.service.ts` file (`servicesFolderContents`, default on). Optional `serviceDirectories` requires `*.service.ts` files to sit in a `services` folder under the listed roots.
- `bl-js/no-generic-module-names`: report generic folder and file names (`utils`, `util`, `helpers`, `helper`, `common`, `misc`, `stuff`, `things`, and `-utils` / `-helpers` file suffixes). `lib`, TanStack `-lib`, and `shared` are allowed. Configurable through `names` and `allow`.
- `bl-js/no-untyped-json`: report `JSON.parse(…)` and awaited `.json()` results that leak as `any` (unannotated or domain-annotated bindings, returns, member access, `as T`).
- `bl-js/require-own-key-lookup`: require `Object.hasOwn` before reading an object-literal `Record<string, V>` by a runtime key.
- `bl-js/no-object-keys-assertion`: report type assertions on `Object.keys` / `Object.entries` results.

### Changed

**TanStack Router**

- `bl-tanstack-router/require-hook-from` checks only `useNavigate`. TypeScript already requires `from` or `strict: false` on `useParams`, `useSearch`, `useLoaderData`, and `useRouteContext`.

**Effect**

- `bl-effect/no-v3-apis` reports the v3 Schema names `Schema.DateFromSelf` (use `Schema.Date`) and `Schema.DateFromNumber` (use `Schema.DateFromMillis`).

**Elysia**

- `bl-elysia/no-context-param` also reports class methods and class fields typed with Elysia `Context`, once per member.
- `bl-elysia/require-plugin-name` skips the exported route instance in routes leaf files, so a route with no name gets one report.
- `bl-elysia/require-response-schema` no longer has the `missingRedirectStatus` check. Elysia does not validate a `Response` such as a `redirect()` result.

**React**

- **Breaking:** rename `bl-react/no-namespace` to `bl-react/no-react-namespace`. The old id clashed with the Oxlint built-in `react/no-namespace`. Behavior is the same.

### Removed

**TanStack Router**

- `bl-tanstack-router/no-hooks-in-route-lifecycle`: use Oxlint `react/rules-of-hooks`, which reports hooks in `beforeLoad` and `loader`.
- `bl-tanstack-router/require-params-with-path-tokens`: TypeScript already requires `params` for required path tokens.
- `bl-tanstack-router/require-validate-search-when-used`: TypeScript already rejects reads of search that is not validated, and the rule gave false positives for search that a parent route validates.

**Effect**

- `bl-effect/no-pipe-on-fn`: `Effect.fn(...)(...)` returns a plain function, so `.pipe` on it does not compile, and the rule could never report.
- `bl-effect/prefer-date-from-string`: `bl-effect/no-v3-apis` now reports its two names.

**Elysia**

- `bl-elysia/no-controller-context-class`: merged into `bl-elysia/no-context-param` (messageId `contextClass`).
- `bl-elysia/no-route-factory`: replaced by `bl-elysia/no-elysia-factory-function`, which checks the function body for `new Elysia(…)` instead of the name.

**JS / TS**

- `bl-js/max-classes`: use `"eslint/max-classes-per-file": ["error", { "max": 5, "ignoreExpressions": true }]`.
- `bl-js/no-reflect-apply`, `bl-js/no-reflect-get`: use `"eslint/no-restricted-properties"` with `{ "object": "Reflect", "property": "apply" | "get", "message": "…" }`.
- `bl-js/no-conditional-empty-object-spread`: no replacement. `{ ...(cond ? { b } : {}) }` is the usual form with `exactOptionalPropertyTypes`.

### Fixed

**TanStack Router**

- `bl-tanstack-router/require-throw-not-found` accepts `return notFound()`. The router handles a returned `notFound()` in `loader`, `beforeLoad`, and server functions.
- `bl-tanstack-router/no-control-flow-outside-edge` accepts `redirect()` in files that call `createMiddleware`.
- `bl-tanstack-router/no-search-in-loader` reports only the loader context `search` and `location.search`. It no longer reports `deps.search` or `search` fields on loaded data.
- `bl-tanstack-router/require-hook-from` requires `from` on `useNavigate`. `useNavigate` has no `strict` option, so `{ strict: false }` no longer passes.
- `bl-tanstack-router` diagnostics for `no-relative-to-without-from`, `no-get-route-api`, `no-not-found-in-component`, `require-inline-route-options`, and `no-dynamic-to` now state correct reasons.

**Effect**

- `bl-effect/require-timeout-on-external-io`: skip an `Effect.tryPromise` whose Promise function has no call, `new`, or tagged template, such as `() => result.finishReason` or `async () => await pending`. It only awaits a promise that already exists, so the timeout belongs to the code that made that promise.
- `bl-effect/require-fn-name` accepts a template literal span name in a factory that makes many functions, such as ``Effect.fn(`Tools.${name}`)``. The name must start with a fixed owner. A bound function must end with its binding. The message says that `Effect.fn` with no name makes no span.
- `bl-effect/prefer-date-from-string` no longer reports `Schema.Date`. In v4 it is the correct schema for `Date` instances. The rule still reports the v3 names `DateFromSelf` and `DateFromNumber`.
- `bl-effect/schema-no-legacy-filter` checks methods only on a schema value, not on data such as `Schema.Literals([...]).literals.filter(...)`. It also reports the v3 filters `int`, `finite`, `greaterThan`, `lessThan`, `between`, `multipleOf`, `minLength`, `maxLength`, `UUID`, and `ULID`. The `filter` fix is now `Schema.check(Schema.makeFilter(predicate))`.
- `bl-effect/require-return-yield-on-fail` no longer reports a fail inside a value, such as `row ?? (yield* new NotFound())` or `ok ? value : yield* fail`. It also reports `Effect.failCause` and `Effect.failCauseSync`.
- `bl-effect/prefer-vitest` no longer reports a test that returns `Effect.runPromise(...)`, `Effect.runSync(...)`, or a pipe that ends in a runner.
- `bl-effect/require-service-static-layer` also requires `static readonly layer` when the class sets `options.make`. In v4, `make` only stores the constructor Effect. It does not make a layer.
- `bl-effect/prefer-decode-unknown` no longer reports the v4 transformation forms `Schema.decode(SchemaTransformation.trim())` and `Schema.encode(transformation)`.
- `bl-effect/prefer-service-of` also checks `Layer.succeed`, `Layer.sync`, and arrow bodies such as `() => ({ … })`. The message no longer says that `.of` brands the service.
- `bl-effect/no-try-catch-in-gen` has a new `tryFinally` message. A failed `yield*` does not run `catch` or `finally` in the generator.
- `bl-effect/no-v3-apis` follows the Effect v3-to-v4 migration reference: `zipLeft` → `Effect.tap`; adds `tapErrorCause`, `ignoreLogged`, `optionFromOptional`, `makeSemaphore`, `makeLatch`, `dieMessage`, `Layer.tapErrorCause`, and the `Stream` renames; gives replacements for `catchSomeDefect`, `forkAll`, and `forkWithErrorHandler`.
- `bl-effect/no-v3-imports` maps `@effect/platform/Command`, `Socket`, `Worker*`, `Ndjson`, `MsgPack`, `OpenApi`, other `HttpApi*` modules, and `@effect/typeclass/*` to their v4 modules.
- `bl-effect/no-run-promise-in-modules` also reports `Effect.runSyncExitWith`.
- `bl-effect`: corrected the Why / Fix text of `no-throw-in-gen`, `no-yield-ref-handle`, `no-it-scoped`, `prefer-schema-tagged-error`, and `no-date-now`.

**Elysia**

- `bl-elysia/require-route-schema`, `bl-elysia/require-response-schema`: a `.guard({…})` with no callback earlier in the chain now covers later routes. A guard after the route no longer counts. A call on an unknown receiver counts as a route only when its path starts with `/`.
- `bl-elysia/no-context-param`, `bl-elysia/no-controller-context-class`: match only Elysia `Context` (also aliased or namespaced). Effect `Context.Context` and other `Context` types no longer report.
- `bl-elysia/prefer-status-helper`: report `error()` only when it is destructured from the handler context. `logger.error()` and imported helpers no longer report.
- `bl-elysia/prefer-throw-status`: report only built-in errors (`Error`, `TypeError`, …, with or without `new`). Elysia and custom error classes no longer report. Now also checks macro `resolve` and `mapResolve`.
- `bl-elysia/require-error-body-literal`: check named error statuses such as `status('Not Found', …)`.
- `bl-elysia/prefer-resolve-for-auth`, `bl-elysia/require-response-schema`: correct the Why text for Elysia 1.4.
- `bl-elysia`: `connect`, `mapDerive`, `mapResolve`, and the `resolve` hook key count as route or handler context.

**Zod**

- `bl-zod/modern-format-validators`: `uuidv4/6/7` map to the versioned factories. Add `xid`, `ksuid`, and Zod 3 `cidr`. `ip` maps to a union. Message text is corrected.
- `bl-zod/schema-naming`: skip `.parse()`, `.safeParse()`, `.decode()`, `.implement()`, and similar value chains. Add `stringbool`, `uuidv4/6/7`, `optional`, `keyof`, and other Zod 4 builders.

**React**

- `bl-react/no-native-html`: allow `<input type="hidden">`, and allow a tag in the file that exports its replacement component (`Input` may render `<input>`, `TableRow` may render `<tr>`). Add the `hostFiles` option to skip host files by path.
- `bl-react/prefer-context-as-provider`: also report `XContext.Provider` read outside JSX (`const ThemeProvider = ThemeContext.Provider`) when `XContext` comes from `createContext` in the same file or is imported.
- `bl-react`: `memo` / `forwardRef` wrappers read only their first argument as the component. `const RowsMemo = memo(Rows, areEqual)` is no longer a second component in `no-multi-component-files`, and a comparator is no longer checked as a component by the other component rules. An inline `memo(function Rows() {…})` still counts as one component.
- `bl-react`: a declaration inside an anonymous callback is no longer module-level (`no-multi-component-files`, `component-props-type`, `hook-file-name-match`, `no-multi-hook-files`).
- `bl-react/component-props-type`: read qualified wrapper types such as `React.FC<FooProps>`.
- `bl-react/no-native-html`: default hints name real parts (`hr` → `Separator`, `summary` → `Collapsible.Trigger`, `thead` → `TableHeader`, …).
- `bl-react/no-jsx-module-constants`: correct the Why text.

**Base UI**

- `bl-base-ui/require-native-button-with-render`: report `requireDynamic` when `render` mixes a `<button>` and a non-button (a falsy `render` counts as the part's default element) instead of advising `nativeButton={false}`. Fix the `requireTrue` text for parts whose default is false.

**Tailwind**

- `bl-tailwind/no-classname-constants`: report class names in a function-local variable with the new `localClassNames` message and an accurate reason. `storedClassNames` now covers module-level constants and class fields only.
- `bl-tailwind/no-classname-constants`: detect Tailwind v4 class lists (theme colors such as `bg-primary`, `gap-1.5`, `flex!`, `w-(--x)`, `group/item`, `@container`, `inline-flex`, `border-b`, v4.3 utility families and colors).

**JS / TS**

- `bl-js/no-runtime-typeof`: treat a global lib type (such as `FormDataEntryValue` or `PropertyKey`) as a declared contract, and resolve `Partial`, `Readonly`, `Required`, `NonNullable`, and `Awaited` through their argument. Known object-only globals (`Date`, `Map`, `Array`, `Record`, `Promise`, `*Error`, typed arrays, `URL`, `Request`, `Response`, `Blob`, `File`, DOM elements and events) and `unknown` / `any` are still reported.
- `bl-js/no-runtime-typeof`: allow `typeof` on a parameter, binding, or one-level member whose declared type in this file is a union with a primitive, literal, or function member (for example `string | ((state: State) => string)`), and inside schema predicates (`z.custom`, `.refine`, `.superRefine`, `Schema.declare`, `Schema.makeFilter`, `Schema.filter`, `Predicate.*`).
- `bl-js/no-unknown-parameters`: do not report the `unknown` input of a callback parameter type (`decode: (body: unknown) => A`). The value flows out to the callback.
- `bl-js/no-unsafe-dictionary-type`: do not report a parameter annotation of a contextually typed function (call argument, JSX expression, `satisfies` value, annotated variable), such as `validateSearch: (search: Record<string, unknown>) => …`.
- `bl-js/no-runtime-typeof`, `bl-js/no-unknown-parameters`: allow a small decoder to use `typeof` on its input. A decoder has one `unknown` parameter, an explicit data return type, and no `as`, `!`, or `any` in its body. New option `allowDecoders`, default `true`.
- `bl-js/no-runtime-typeof`: allow `typeof` on a value typed as a type parameter whose constraint is a declared union with a primitive, literal, or function member (for example `<T extends number | string | (() => void)>(value: T)`). An unconstrained `T` is treated as `unknown` and is still reported. The Avoid text names the workarounds not to use: `Object.prototype.toString.call(x)`, `instanceof Object`, `in` checks, and `Number.isFinite(x as number)`.
- `bl-js/no-runtime-typeof`: resolve a destructured parameter with a default (`{ grid = false }: Props`, `{ grid: g = false }: Props`) the same as `{ grid }: Props`.
- `bl-js/no-runtime-typeof`: allow `typeof` on a value whose annotation names a type that this file cannot read (an imported type, an indexed access such as `ReactElement["type"]`, a qualified name, or a type query), and on members of such types. `unknown`, `any`, missing annotations, unconstrained type parameters, and local object-only types are still reported.
- `bl-js/no-runtime-typeof`: trace a value with no annotation back to an annotated source: a `const` or never-reassigned `let`, a member or indexed read, a `for…of` element of an array type, a destructured element, a conditional whose branches all trace, or an `as T` assertion. A member of `Props` resolves through `Props | undefined`. `as unknown`, `as any`, reassigned `let` bindings, and untraceable values are still reported.
- `bl-js/no-known-value-widening`: do not report `Record<K, V>` or mapped types with a closed key union, or a dictionary that the file reads by a runtime key. Inline object types get an `anonymousObject` message.
- `bl-js/no-inline-import-type`: skip global declaration files (a `.d.ts` with no `import` / `export`).
- `bl-js/no-shape-in-symbol-names`: report only names the file declares, not member reads, JSX tags, object keys, or unchanged imports.
- `bl-js/no-runtime-typeof`: allow feature tests of undeclared globals (`typeof window`, `typeof globalThis.x`).
- `bl-js/no-unknown-parameters`, `bl-js/no-unknown-returns`, `bl-js/no-object-parameters`: skip overload implementation signatures.
- `bl-js/no-object-parameters`: show the correct parameter name for default, rest, and parameter-property parameters.
- `bl-js/no-unsafe-dictionary-type`: skip type parameter constraints and conditional type tests.
- `bl-js/no-useless-reexport`: skip tool config files (`*.config.*`) and files with `"use client"` / `"use server"`.
- `bl-js/require-safety-comment-for-type-assertion`: accept a comment above `export`. A comment above an enclosing function no longer covers inner assertions.
- `bl-js/no-reflect-get`, `bl-js/no-reflect-apply`, `bl-js/no-conditional-empty-object-spread`: correct the diagnostic text.
- `bl-js/no-module-mocking`: also report `mock.module` from `bun:test` and `node:test`.

## [0.4.9] - 2026-09-22

### Added

- `bl-effect/require-service-filename`: require `.service.ts` for files that define an Effect v4 service.
- `bl-effect/max-services`: allow at most one Effect v4 service per file.

## [0.4.8] - 2026-09-18

### Fixed

- `bl-effect/prefer-service-of`: check service factory returns without flagging data returned by nested methods, helpers, or transaction callbacks.

## [0.4.7] - 2026-09-15

### Added

- `bl-effect/require-gen-self-options`: flag `Effect.gen(this, function* () { … })`. Use `Effect.gen({ self: this }, function* () { … })` (`effect@4.0.0-rc.115`).

### Changed

- Effect rules target Effect **`4.0.0-rc.115`**.
- `bl-effect/no-v3-imports`: `effect/FastCheck` and `effect/testing/FastCheck` → `fast-check`; `effect/ParseResult` → `effect/SchemaIssue`; `effect/SchemaError` → `effect/Schema`; `@effect/cli/Args` → `effect/unstable/cli/Argument`; `@effect/cli/Options` → `effect/unstable/cli/Flag`; `effect/unstable/encoding/Msgpack` → `SchemaBinary`.
- `bl-effect/schema-no-legacy-filter`: also flag `filterEffect`, `rename`, `encodedSchema`, `typeSchema`, `encodedBoundSchema`, and `toArbitrary`.
- `bl-effect/no-v3-apis`: also flag v4 Predicate renames (`isRecord` → `isObject`, `isNullable` → `isNullish`, `isNotNullable` → `isNotNullish`, `isReadonlyRecord` → `isReadonlyObject`).
- `bl-effect/prefer-predicate`: point local `isRecord` / `isNullable` / `isNotNullable` / `isReadonlyRecord` helpers at the v4 `Predicate.*` names.
- `bl-effect/prefer-fn` / `bl-effect/no-pipe-on-fn`: treat `Effect.fnUntraced` as the library/hot-path form from Effect RC `LLMS.md`.

## [0.4.6] - 2026-09-14

### Changed

- `bl-react/require-bare-hook-call`: allow `return useFoo()` and a named hook or component arrow that is only `() => useFoo()`. Still flag `.prop`, `?.`, `??`, and other syntax after the call.

## [0.4.5] - 2026-09-14

### Added

- `bun run bench`: time every Bellona rule on a mixed synthetic corpus. Flags: `--plugin`, `--rule`, `--scale`, `--repeat`, `--json`, `--keep`.

### Changed

- `bl-js/no-useless-reexport`: resolve local import uses from scope references instead of walking the whole file once per import.
- `bl-js/no-widen-then-assert`: resolve identifiers with `getScope` instead of scanning every scope on each assertion.
- `bl-js/no-unsafe-dictionary-type`: cache dictionary classification per type node in a file.
- `bl-js/require-safety-comment-for-type-assertion`, `bl-js/no-shape-in-symbol-names`, and `bl-js/no-unknown-parameters`: read options once in `before()`.

## [0.4.4] - 2026-09-07

### Added

- `bl-react/require-bare-hook-call`: write `const tags = useSomethingTags();` only. Do not add `.prop`, `?.`, `??`, or other syntax after the hook call.

### Changed

- `bl-tanstack-router/require-params-with-path-tokens`: do not require `params` for optional path tokens (`{-$locale}`, `prefix{-$name}`). Still require `params` for `$postId` and mixed paths.

## [0.4.3] - 2026-09-05

### Added

- `bl-tanstack-router/no-control-flow-outside-edge`: keep `notFound()` and `redirect()` in route modules or `createServerFn` handlers.
- `bl-tanstack-router/no-not-found-in-component`: do not throw `notFound()` from route UI (`component` / pending / error / not-found).
- `bl-tanstack-router/no-loader-data-in-not-found`: do not call `useLoaderData` inside `notFoundComponent`.
- `bl-tanstack-router/no-not-found-route`: ban the deprecated `NotFoundRoute` / `notFoundRoute` API.
- `bl-tanstack-router/require-inline-route-options`: pass an inline options object to `createFileRoute` / `createRoute` / `createRootRoute` / `createLazy*`. Do not pass a shared helper such as `legalRoute("…")`.

## [0.4.2] - 2026-09-05

### Added

- `bl-react/no-impl-component-suffix`: ban PascalCase component names that contain an `Impl` name segment (including nested helpers and `*ImplProvider`).

### Changed

- `bl-react/no-multi-component-files`: `*Impl` counts as a primary component. Only `*Provider` / `*Context` stay as helpers.

## [0.4.1] - 2026-08-26

### Changed

- `bl-react/component-props-type`: skip primary components that do not type props. The `{Name}Props` checks run only when the component has a props type or a typed props parameter.

## [0.4.0] - 2026-08-26

### Added

- `bl-js/no-inline-import-type`: do not write `import("…").Type` in a type position; use a top-level type import.
- `bl-js/no-useless-reexport`: do not add re-export-only files or unchanged re-exports; import from the source module.
- `bellona/tailwind` plugin with `bl-tailwind/no-classname-constants`: do not store Tailwind class names in constants; use `tv` / `createTV` or a reusable component.
- `bl-react/component-props-type`: each primary component must use a non-empty `{Name}Props` type declared in the same file.

### Changed

- All rule diagnostics now use a four-part agent message: **Problem**, **Why**, **Fix**, **Avoid**. Placeholders (`{{name}}`, …) are unchanged.
- Consumer skill (`skills/bellona/`): 0.4.0 snapshot, diagnostic workflow, full enable-many paste, `bl-*` OpenAI prompt.

## [0.3.0] - 2026-08-24

### Changed

- Plugin `meta.name` is unique per subpath (`bl-js`, `bl-react`, `bl-base-ui`, `bl-zod`, `bl-tanstack-router`, `bl-elysia`, `bl-effect`).
- Rule ids are `bl-<plugin>/<slug>` (example: `bl-js/max-classes`).
- Old ids such as `bellona/js-max-classes` no longer match. Update `rules` and `oxlint-disable` comments.

## [0.2.0] - 2026-08-24

### Changed

- Rule ids became `bellona/<plugin>-<slug>` (example: `bellona/js-max-classes`). Plugin `meta.name` was `bellona` for every subpath.
- Slugs no longer repeated the plugin token (`bellona/zod-schema-naming`, not `bellona/zod-zod-schema-naming`).
- Older ids such as `js/bn-max-classes` no longer matched.

## [0.1.0] - 2026-08-22

### Added

- Public npm package `bellona` with opt-in Oxlint JS plugins.
- Subpath plugins: `bellona/js`, `bellona/react`, `bellona/base-ui`, `bellona/zod`, `bellona/tanstack-router`, `bellona/elysia`, `bellona/effect`.
- Specifier catalog on the package root (`plugins.js`, `plugins.react`, and the other keys).
- Consumer agent skill under `skills/bellona/`.

[Unreleased]: https://github.com/DobroslavRadosavljevic/bellona/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/DobroslavRadosavljevic/bellona/compare/v0.4.9...v0.5.0
[0.4.9]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.9
[0.4.8]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.8
[0.4.7]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.7
[0.4.6]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.6
[0.4.5]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.5
[0.4.4]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.4
[0.4.3]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.3
[0.4.2]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.2
[0.4.1]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.1
[0.4.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.0
[0.3.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.3.0
[0.2.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.2.0
[0.1.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.1.0
