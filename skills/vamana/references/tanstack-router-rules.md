# vamana/tanstack-router rules

Plugin name: `tanstack-router`. Ids: `tanstack-router/vm-<slug>`.

**Skip:** files that do not import `@tanstack/react-router`, `@tanstack/solid-router`, `@tanstack/react-start`, or `@tanstack/solid-start`; test/spec/stories; `allow`.

Shared intent: keep `to` / `from` / `params` / `search` as string literals so the router can infer types. Do not bypass inference with assertions, `getRouteApi`, or `Route.useX()`.

## `tanstack-router/vm-create-route-property-order`

`createRoute` / `createRootRoute` / `createFileRoute` / `createRootRouteWithContext` option keys must follow inference order:

`params` / `validateSearch` → `search` → `loaderDeps` / `ssr` → `context` → `beforeLoad` → `loader` → lifecycle (`onEnter`, `onStay`, `onLeave`, `head`, `scripts`, `headers`, `remountDeps`).

## `tanstack-router/vm-no-dynamic-router-to`

`to` on `Link` / `Navigate` / `navigate` / `redirect` / `linkOptions` / `buildLocation` / `preloadRoute` must be a string literal (or a static template with no expressions). No interpolation, concat, or variables.

```tsx
<Link to="/posts/$postId" params={{ postId }} />
navigate({ to: '/posts/$postId', params: { postId } })
```

## `tanstack-router/vm-no-get-route-api`

Disallow `getRouteApi` and bound hooks `Route.useLoaderData()` / `routeApi.useX()`.

Prefer: `useLoaderData({ from: '/posts/$postId' })` (and the other hooks with `from`).

## `tanstack-router/vm-no-hooks-in-route-lifecycle`

Disallow React hooks inside `beforeLoad` or `loader`.

Prefer: put values on router `context`, or call non-hook APIs (`queryClient.ensureQueryData`).

## `tanstack-router/vm-no-imperative-location-navigation`

Disallow `location.assign` / `history.push` / similar for in-app navigation when the file imports the router.

Prefer: `Link`, `navigate`, `redirect`, `router.navigate({ to, params })`.

## `tanstack-router/vm-no-relative-router-to-without-from`

Relative `to` (`./`, `../`, or empty) requires `from` (`from={Route.fullPath}` or `useNavigate({ from })`).

## `tanstack-router/vm-no-router-href`

Disallow `href` for in-app links. Prefer typed `to` + `params`/`search`.

Literal external `href` is allowed when it starts with `http:`, `https:`, `mailto:`, `tel:`, or `//`.

## `tanstack-router/vm-no-router-type-assertion`

Disallow asserting `to` / `from`, and annotating/casting router hook results.

Prefer: string-literal paths or `linkOptions(...)`; let inference flow.

## `tanstack-router/vm-no-search-in-loader`

Do not read `search` inside `loader`. Declare `validateSearch`, map fields in `loaderDeps`, read `deps` in the loader.

## `tanstack-router/vm-require-params-with-path-tokens`

If `to` contains `$` tokens, pass a `params` object.

```ts
navigate({ to: '/posts/$postId', params: { postId: id } })
```

## `tanstack-router/vm-require-router-hook-from`

Bare `useNavigate` / `useParams` / `useSearch` / `useLoaderData` / `useRouteContext` need `{ from }` or `{ strict: false }` (shared components).

## `tanstack-router/vm-require-throw-not-found`

`notFound()` must be thrown, returned, or called with `{ throw: true }`. A bare call does not stop the loader.

## `tanstack-router/vm-require-throw-redirect`

`redirect({ to })` must be thrown, returned, or `{ throw: true }`. A bare call does not navigate.

## `tanstack-router/vm-require-validate-search-when-used`

If the route reads search params, it must declare `validateSearch`. Search is raw URL text until parsed.
