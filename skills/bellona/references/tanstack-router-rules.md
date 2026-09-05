# bellona/tanstack-router rules

Plugin name: `bl-tanstack-router`. Ids: `bl-tanstack-router/<slug>`.

**Skip:** files that do not import `@tanstack/react-router`, `@tanstack/solid-router`, `@tanstack/react-start`, or `@tanstack/solid-start`; test/spec/stories; `allow`.

Shared intent: keep `to` / `from` / `params` / `search` as string literals so the router can infer types. Do not bypass inference with assertions, `getRouteApi`, or `Route.useX()`.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-tanstack-router/no-control-flow-outside-edge`

`notFound()` and `redirect()` belong in a route module (`createFileRoute` / `createRoute` / `createRootRoute*`) or a `createServerFn` handler. Do not throw them from `lib/` helpers.

## `bl-tanstack-router/no-not-found-in-component`

Do not call `notFound()` inside `component`, `pendingComponent`, `errorComponent`, or `notFoundComponent`. Throw it in `loader` or `beforeLoad`.

## `bl-tanstack-router/no-loader-data-in-not-found`

Do not call `useLoaderData` (or `Route.useLoaderData()`) inside `notFoundComponent`. Use `useParams` / `useSearch` / `useRouteContext`, or `notFound({ data })`.

## `bl-tanstack-router/no-not-found-route`

Do not use deprecated `NotFoundRoute` or `createRouter({ notFoundRoute })`. Use `notFoundComponent` on the root route, or `defaultNotFoundComponent` on `createRouter`.

## `bl-tanstack-router/create-route-property-order`

`createRoute` / `createRootRoute` / `createFileRoute` / `createRootRouteWithContext` option keys must follow inference order:

`params` / `validateSearch` → `search` → `loaderDeps` / `ssr` → `context` → `beforeLoad` → `loader` → lifecycle (`onEnter`, `onStay`, `onLeave`, `head`, `scripts`, `headers`, `remountDeps`).

## `bl-tanstack-router/no-dynamic-to`

`to` on `Link` / `Navigate` / `navigate` / `redirect` / `linkOptions` / `buildLocation` / `preloadRoute` must be a string literal (or a static template with no expressions). No interpolation, concat, or variables.

```tsx
<Link to="/posts/$postId" params={{ postId }} />
navigate({ to: '/posts/$postId', params: { postId } })
```

## `bl-tanstack-router/no-get-route-api`

Disallow `getRouteApi` and bound hooks `Route.useLoaderData()` / `routeApi.useX()`.

Prefer: `useLoaderData({ from: '/posts/$postId' })` (and the other hooks with `from`).

## `bl-tanstack-router/no-hooks-in-route-lifecycle`

Disallow React hooks inside `beforeLoad` or `loader`.

Prefer: put values on router `context`, or call non-hook APIs (`queryClient.ensureQueryData`).

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

Do not read `search` inside `loader`. Declare `validateSearch`, map fields in `loaderDeps`, read `deps` in the loader.

## `bl-tanstack-router/require-inline-route-options`

`createFileRoute` / `createRoute` / `createRootRoute` / `createLazyFileRoute` / `createLazyRoute` must take an inline options object. Do not pass a helper (`legalRoute("…")`), a shared variable, or `{ ...helper() }`.

```tsx
export const Route = createFileRoute('/{-$locale}/accessibility/')({
  component: AccessibilityPage,
})
```

## `bl-tanstack-router/require-params-with-path-tokens`

If `to` contains `$` tokens, pass a `params` object.

```ts
navigate({ to: '/posts/$postId', params: { postId: id } })
```

## `bl-tanstack-router/require-hook-from`

Bare `useNavigate` / `useParams` / `useSearch` / `useLoaderData` / `useRouteContext` need `{ from }` or `{ strict: false }` (shared components).

## `bl-tanstack-router/require-throw-not-found`

`notFound()` must be thrown, returned, or called with `{ throw: true }`. A bare call does not stop the loader.

## `bl-tanstack-router/require-throw-redirect`

`redirect({ to })` must be thrown, returned, or `{ throw: true }`. A bare call does not navigate.

## `bl-tanstack-router/require-validate-search-when-used`

If the route reads search params, it must declare `validateSearch`. Search is raw URL text until parsed.
