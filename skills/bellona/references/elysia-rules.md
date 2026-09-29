# bellona/elysia rules

Plugin name: `bl-elysia`. Ids: `bl-elysia/<slug>`.

**Skip (most rules):** no `elysia` import, test/spec/stories, `allow`.

**Exceptions:**

- `bl-elysia/no-elysia-factory-function` is gated by path (`directories`, default `/modules/` and `/routes/`). It needs no `elysia` import.
- `bl-elysia/prefer-eden-treaty-in-tests` runs **only** on `*.test.*` / `*.spec.*` files. It needs no `elysia` import.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

Path helpers (slash-normalized):

| Gate | True when |
| --- | --- |
| routes leaf | path contains `/routes/` and basename is not `index.*` |
| routes index | `/routes/` + `index.*` |
| plugins dir | path contains `/plugins/` |

## `bl-elysia/no-context-param`

Do not type function or class method parameters as Elysia `Context`. Destructure `{ body, params, status, … }`.

Functions report each parameter (`contextParam`). Class methods and class fields report once on the member name (`contextClass`), so controllers stay free of HTTP types.

Matches `Context` imported from `elysia` (also `Context as Ctx`), `E.Context` from `import * as E from 'elysia'`, and `import('elysia').Context`. An unimported `Context` also counts. A `Context` from another package (Effect `Context.Context`, Hono) or a local type does not count.

## `bl-elysia/no-cookie-undefined-check`

`cookie.name` is a Proxy that always exists. Check `cookie.name.value`, not `cookie.name == null` / `!cookie.sid`.

## `bl-elysia/no-functional-plugin-callback`

Disallow `.use((app) => app.get(…))`. Prefer `new Elysia({ name }).get(…)`.

Does not flag Effect `Service.use`.

## `bl-elysia/no-decorate-singletons`

Do not put app singletons on the Elysia context: `.decorate('db', db)` or `.decorate({ db, runtime })`. Also `.decorate({ as: 'override' }, …)` forms. Import the owning module where you use it.

| Option | Default |
| --- | --- |
| `names` | `['db', 'database', 'runtime', 'redis', 'client']` |

## `bl-elysia/no-elysia-factory-function`

Do not declare module-level functions whose body builds `new Elysia(…)` (route or plugin factories): function declarations, `const f = () => …`, and exported or default-exported forms. Declare one module-level instance and import db / runtime modules directly.

| Option | Default |
| --- | --- |
| `directories` | `['/modules/', '/routes/']` (an empty list means every path) |

## `bl-elysia/no-set-redirect`

Do not assign `set.redirect = url` (also `ctx.set.redirect`). Elysia 1.4 marks it `@deprecated`. Return `redirect(url)` or `redirect(url, 303)`.

## `bl-elysia/one-route-method-per-file`

**Routes leaf files only.** At most one `.get` / `.post` / … per file.

## `bl-elysia/hook-after-routes`

A local lifecycle hook after the last route of a `new Elysia()` chain runs for no route. Elysia applies a local hook only to routes registered after it.

Checked hooks: `onBeforeHandle`, `onAfterHandle`, `onTransform`, `onParse`, `derive`, `resolve`, `mapDerive`, `mapResolve`. Route-registering calls: route verbs, `ws`, `use`, `group`, `mount`, and `guard(hook, callback)`.

Not reported:

- a hook with `{ as: 'scoped' }` / `{ as: 'global' }` or non-static options (it applies to parent routes)
- a chain with a later `.as(…)`
- a chain with no route
- a chain bound to a variable that gets more routes later in the file (`app.get(…)`)
- `onError`, `onRequest`, `onAfterResponse`, `mapResponse`: the app-wide request and error handlers use them too, so a late one still runs

## `bl-elysia/prefer-eden-treaty-in-tests`

**`*.test.*` / `*.spec.*` files only.** Do not call `app.handle(new Request(…))` (also through a same-file `const`). Use `treaty(app)` from `@elysia/eden`. It calls the app in process and types each request and response.

## `bl-elysia/prefer-resolve-for-auth`

**`/plugins/` only.** Prefer `.resolve` or a macro for auth/session. Do not `.derive` cookie / `Authorization` / user/session.

`.derive` runs in the transform phase, before validation. `.resolve` runs after validation, so it reads validated `headers` / `cookie`.

## `bl-elysia/prefer-status-helper`

Prefer `status(code, value)` over `set.status` and the old context `error()`. Elysia 1.3 renamed context `error` to `status`. The Elysia 1.4 context has no `error`. `status()` keeps Eden/response typing.

The `error()` check reports only a bare `error(…)` whose `error` is destructured from the handler argument (`({ error }) => error(404)`). It does not report `logger.error(…)` or an imported `error` helper.

## `bl-elysia/prefer-throw-status`

Inside handlers, prefer `return status(...)` over thrown built-in errors (`Error`, `TypeError`, `RangeError`, …, with or without `new`) and thrown strings. `throw status(...)` is allowed for onError-style paths.

Custom error classes are not reported. Elysia `NotFoundError` and classes with `status` / `toResponse()` are a documented Elysia pattern.

Handler context includes route handlers, route hooks (`beforeHandle`, `resolve`, …), macro `resolve`, and instance lifecycle (`onBeforeHandle`, `derive`, `resolve`, `mapDerive`, `mapResolve`, …).

## `bl-elysia/require-error-body-literal`

`status(4xx|5xx, { code })` must use a string literal or a same-file const string for `code` (no templates or member access).

Named statuses count too: `status('Not Found', { code })` is the same as `status(404, { code })`.

## `bl-elysia/require-plugin-name`

Exported `new Elysia()` plugins need `{ name: '…' }` for lifecycle dedup.

In routes leaf files, the exported route instance (`export const xRoute = new Elysia()…` or `export default new Elysia()`) is skipped. `bl-elysia/require-route-export-name` reports it, so a route with no name gets one report.

Also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts` (plus `allow`). Skips `.listen(...)` chains.

## `bl-elysia/require-response-schema`

Require a `response` schema on routes.

| Option | Default |
| --- | --- |
| `requireAllRoutes` | `true` |

When `false`, only flag handlers that call `status()` / `redirect()`.

Only a bare `status(…)` / `redirect(…)` call counts (not `res.status(…)` or `a.b.status(…)`).

Why: Eden gets `status()` types from the handler, so `response` is not needed for types. Elysia uses `response` to validate and clean returned bodies, and OpenAPI uses it to show them.

A `.guard({ response })` earlier in the same chain counts (see `require-route-schema`).

## `bl-elysia/require-route-export-name`

**Routes leaf files.** Exported Elysia instances must be camelCase `…Route` / `…Routes`. `new Elysia({ name })` must be SCREAMING_SNAKE equal to that binding (`usersRoute` → `USERS_ROUTE`).

## `bl-elysia/require-route-schema`

Request schemas on mutating routes, path params, and destructured handler props.

Schema sources:

- the route hook object
- an enclosing `.guard({…}, (app) => …)` / `.group(path, {…}, (app) => …)` callback
- a `.guard({…})` with no callback earlier in the same chain (`new Elysia().guard({ params }).get('/:id', …)`), also through a same-file binding

A guard after the route, or a guard with a callback earlier in the chain, does not count. Elysia applies those only to other routes.

When the receiver is not a proven `new Elysia()` chain, the call counts as a route only when the path is a string that starts with `/`. `kv.put('key', value)` is not a route.

| Option | Default |
| --- | --- |
| `methods` | `['post', 'put', 'patch']` |

Flags missing `body` / `query` / `params` / `headers` / `cookie` when the handler destructures those fields, and missing `params` when the path has `:param`.

## `bl-elysia/status-code-in-response`

`status(N, …)` (or a named status such as `status('Not Found', …)`) in a route handler needs a key `N` in the route's inline `response` object. Elysia validates and cleans a body only for listed codes.

Only the `status` imported from `elysia` is checked. The handler context `status` (`({ status }) => …`) is typed against `response`, so TypeScript already rejects unknown codes.

Skipped: macro keys on the route hook (`user: true`), spreads, a non-object `response` (`t.String()`), non-numeric response keys, and routes where a guard also declares `response`.

## `bl-elysia/routes-index-mount-only`

**`routes/index.ts` only.** Mount table: `new Elysia` + `.use` / `.as`. No route verbs, no lifecycle handlers.
