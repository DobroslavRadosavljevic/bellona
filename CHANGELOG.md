# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Oxlint JS plugins are alpha (outside Oxlint semver). A bellona minor may need a matching `oxlint` 1.78 pin.

## [Unreleased]

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

[Unreleased]: https://github.com/DobroslavRadosavljevic/bellona/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.1
[0.4.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.4.0
[0.3.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.3.0
[0.2.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.2.0
[0.1.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.1.0
