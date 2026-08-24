# bellona/elysia rules

Plugin name: `bl-elysia`. Ids: `bl-elysia/<slug>`.

**Skip (most rules):** no `elysia` import, test/spec/stories, `allow`.

**Exception:** `bl-elysia/no-route-factory` is gated to `/modules/` or `/routes/` only (no import required).

Path helpers (slash-normalized):

| Gate | True when |
| --- | --- |
| routes leaf | path contains `/routes/` and basename is not `index.*` |
| routes index | `/routes/` + `index.*` |
| plugins dir | path contains `/plugins/` |
| modules dir | path contains `/modules/` |

## `bl-elysia/no-context-param`

Do not type handler parameters as Elysia `Context`. Destructure `{ body, params, status, … }`.

## `bl-elysia/no-controller-context-class`

Do not type class methods with Elysia `Context`. Keep controllers decoupled from HTTP.

## `bl-elysia/no-cookie-undefined-check`

`cookie.name` is a Proxy that always exists. Check `cookie.name.value`, not `cookie.name == null` / `!cookie.sid`.

## `bl-elysia/no-functional-plugin-callback`

Disallow `.use((app) => app.get(…))`. Prefer `new Elysia({ name }).get(…)`.

Does not flag Effect `Service.use`.

## `bl-elysia/no-route-factory`

In `/modules/` and `/routes/`, do not export HTTP/route factory helpers.

| Option | Default |
| --- | --- |
| `patterns` | `^(make\|create).*(Route\|Handler\|Http)`, `RouteFactory$`, `HttpMapper$` |

Declare one Elysia route plugin per file instead of `makeUserRoute()`.

## `bl-elysia/one-route-method-per-file`

**Routes leaf files only.** At most one `.get` / `.post` / … per file.

## `bl-elysia/prefer-resolve-for-auth`

**`/plugins/` only.** Prefer `.resolve` or a macro for auth/session. Do not `.derive` cookie / `Authorization` / user/session.

## `bl-elysia/prefer-status-helper`

Prefer `status(code, value)` over `set.status` and deprecated `error()`. Elysia 1.3+ renamed context `error` to `status`. `status()` keeps Eden/response typing.

## `bl-elysia/prefer-throw-status`

Inside handlers, prefer `return status(...)` over `throw new Error` / thrown strings. `throw status(...)` is allowed for onError-style paths.

## `bl-elysia/require-error-body-literal`

`status(4xx|5xx, { code })` must use a string literal or a same-file const string for `code` (no templates or member access).

## `bl-elysia/require-plugin-name`

Exported `new Elysia()` plugins need `{ name: '…' }` for lifecycle dedup.

Also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts` (plus `allow`). Skips `.listen(...)` chains.

## `bl-elysia/require-response-schema`

Require a `response` schema on routes.

| Option | Default |
| --- | --- |
| `requireAllRoutes` | `true` |

When `false`, only flag handlers that call `status()` / `redirect()`, and require redirect status keys `301`/`302`/`303`/`307`/`308` in `response` when `redirect()` is used.

## `bl-elysia/require-route-export-name`

**Routes leaf files.** Exported Elysia instances must be camelCase `…Route` / `…Routes`. `new Elysia({ name })` must be SCREAMING_SNAKE equal to that binding (`usersRoute` → `USERS_ROUTE`).

## `bl-elysia/require-route-schema`

Request schemas on mutating routes, path params, and destructured handler props. Honors enclosing `.guard()` / `.group()`.

| Option | Default |
| --- | --- |
| `methods` | `['post', 'put', 'patch']` |

Flags missing `body` / `query` / `params` / `headers` / `cookie` when the handler destructures those fields, and missing `params` when the path has `:param`.

## `bl-elysia/routes-index-mount-only`

**`routes/index.ts` only.** Mount table: `new Elysia` + `.use` / `.as`. No route verbs, no lifecycle handlers.
