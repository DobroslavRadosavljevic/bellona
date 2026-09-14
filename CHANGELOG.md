# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Oxlint JS plugins are alpha (outside Oxlint semver). A bellona minor may need a matching `oxlint` 1.78 pin.

## [Unreleased]

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

[Unreleased]: https://github.com/DobroslavRadosavljevic/bellona/compare/v0.4.6...HEAD
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
