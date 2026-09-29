# bellona/tanstack-router rules

Plugin name: `bl-tanstack-router`. Ids: `bl-tanstack-router/<slug>`.

**Skip:** files that do not import `@tanstack/react-router`, `@tanstack/solid-router`, `@tanstack/react-start`, or `@tanstack/solid-start`; test/spec/stories; `allow`.

Shared intent: keep `to` / `from` / `params` / `search` as string literals so the router can infer types. Do not bypass inference with assertions, `getRouteApi`, or `Route.useX()`.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-tanstack-router/no-control-flow-outside-edge`

`notFound()` and `redirect()` belong in a route module (`createFileRoute` / `createRoute` / `createRootRoute*`) or a `createServerFn` handler. Do not throw them from `lib/` helpers.

A file that calls `createMiddleware` (TanStack Start) can also throw `redirect()`, for example an auth gate in `.server()`. `notFound()` stays out of middleware files.

## `bl-tanstack-router/no-not-found-in-component`

Do not call `notFound()` inside `component`, `pendingComponent`, `errorComponent`, or `notFoundComponent`. Throw it in `loader` or `beforeLoad`. The router supports a throw in render, but a loader throw stops the match before render and sets the SSR status to 404.

## `bl-tanstack-router/no-loader-data-in-not-found`

Do not call `useLoaderData` (or `Route.useLoaderData()`) inside `notFoundComponent`. Use `useParams` / `useSearch` / `useRouteContext`, or `notFound({ data })`.

## `bl-tanstack-router/no-not-found-route`

Do not use deprecated `NotFoundRoute` or `createRouter({ notFoundRoute })`. Use `notFoundComponent` on the root route, or `defaultNotFoundComponent` on `createRouter`.

## `bl-tanstack-router/create-route-property-order`

`createRoute` / `createRootRoute` / `createFileRoute` / `createRootRouteWithContext` option keys must follow inference order:

`params` / `validateSearch` → `search` → `loaderDeps` / `ssr` → `context` → `beforeLoad` → `loader` → lifecycle (`onEnter`, `onStay`, `onLeave`, `head`, `scripts`, `headers`, `remountDeps`).

## `bl-tanstack-router/no-deprecated-apis`

Disallow APIs that are marked `@deprecated` in `@tanstack/react-router` 1.170 and TanStack Start:

| Deprecated | Use |
| --- | --- |
| `redirect({ code })` | `redirect({ statusCode })` |
| `notFound({ global: true })` | `notFound({ routeId: rootRouteId })` |
| Route option `parseParams` / `stringifyParams` | `params: { parse, stringify }` |
| Route option `preSearchFilters` / `postSearchFilters` | `search: { middlewares }` |
| `navigate` from the `beforeLoad` / `loader` context | `throw redirect({ to })` |
| `startTransition` on `Link` / `Navigate` / navigate options | Nothing. Every navigation uses a transition. |
| `new RouteApi()`, `new Route()`, `new RootRoute()`, `new FileRoute()` | `getRouteApi`, `createRoute`, `createRootRoute`, `createFileRoute` |
| `rootRouteWithContext`, `FileRouteLoader`, `ScrollRestoration`, type `ErrorRouteProps` | `createRootRouteWithContext`, a `loader` in the route file, router option `scrollRestoration`, type `ErrorComponentProps` |
| `useBlocker(fn, condition)`, `useBlocker({ blockerFn })`, `<Block blockerFn>` | `useBlocker({ shouldBlockFn })` |
| Start `.inputValidator()` on `createServerFn` / `createMiddleware` | `.validator()` |

`new Router()` is not reported. The React `Router` constructor has no `@deprecated` tag. Use `createRouter` anyway.

## `bl-tanstack-router/no-dynamic-to`

`to` on `Link` / `Navigate` / `navigate` / `redirect` / `linkOptions` / `buildLocation` / `preloadRoute` must be a string literal (or a static template with no expressions). No interpolation, concat, or variables.

```tsx
<Link to="/posts/$postId" params={{ postId }} />
navigate({ to: '/posts/$postId', params: { postId } })
```

## `bl-tanstack-router/no-get-route-api`

Disallow `getRouteApi` and bound hooks `Route.useLoaderData()` / `routeApi.useX()`.

Prefer: `useLoaderData({ from: '/posts/$postId' })` (and the other hooks with `from`).

## `bl-tanstack-router/no-imperative-location-navigation`

Disallow `location.assign` / `history.push` / similar for in-app navigation when the file imports the router.

Prefer: `Link`, `navigate`, `redirect`, `router.navigate({ to, params })`.

## `bl-tanstack-router/no-relative-to-without-from`

Relative `to` (`./`, `../`, or empty) requires `from` (`from={Route.fullPath}` or `useNavigate({ from })`).

## `bl-tanstack-router/no-href`

Disallow `href` for in-app links. Prefer typed `to` + `params`/`search`.

Literal external `href` is allowed when it starts with `http:`, `https:`, `mailto:`, `tel:`, or `//`.

## `bl-tanstack-router/no-type-assertion`

Disallow asserting `to` / `from`, and annotating/casting router hook results.

Prefer: string-literal paths or `linkOptions(...)`; let inference flow.

## `bl-tanstack-router/no-search-in-loader`

Do not read raw search inside `loader`: the loader context `search`, or `location.search` (also `ctx.location.search` and `window.location.search`). Declare `validateSearch`, map fields in `loaderDeps`, read `deps` in the loader.

A `search` field on `deps` (`deps.search`, `{ deps: { search } }`) or on loaded data is valid.

## `bl-tanstack-router/no-whole-search-loader-deps`

`loaderDeps` must not return the whole `search` object: `({ search }) => search`, `({ search }) => ({ ...search })`, `({ search }) => ({ search })`, or `(ctx) => ctx.search`. Any search change then runs the loader again.

```tsx
loaderDeps: ({ search: { page, q } }) => ({ page, q }),
```

## `bl-tanstack-router/require-inline-route-options`

`createFileRoute` / `createRoute` / `createRootRoute` / `createLazyFileRoute` / `createLazyRoute` must take an inline options object. Do not pass a helper (`legalRoute("…")`), a shared variable, or `{ ...helper() }`.

The router plugin code-splits route keys only from an inline object literal.

```tsx
export const Route = createFileRoute('/{-$locale}/accessibility/')({
  component: AccessibilityPage,
})
```

## `bl-tanstack-router/require-hook-from`

Bare `useNavigate` needs `{ from }`. It has no `strict` option, so `{ strict: false }` does not count. A shared component that uses only absolute `to` paths can pass `from: "/"`.

The rule does not check `useParams` / `useSearch` / `useLoaderData` / `useRouteContext`. Their TypeScript options already require `from` or `strict: false`.

## `bl-tanstack-router/require-throw-not-found`

`notFound()` must be thrown, returned, or called with `{ throw: true }`. A bare call does not stop the loader.

## `bl-tanstack-router/require-throw-redirect`

`redirect({ to })` must be thrown, returned, or `{ throw: true }`. A bare call does not navigate.
