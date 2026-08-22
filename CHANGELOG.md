# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Oxlint JS plugins are alpha (outside Oxlint semver). A bellona minor may need a matching `oxlint` 1.78 pin.

## [Unreleased]

## [0.1.0] - 2026-08-22

### Added

- Public npm package `bellona` with opt-in Oxlint JS plugins.
- Subpath plugins: `bellona/js`, `bellona/react`, `bellona/base-ui`, `bellona/zod`, `bellona/tanstack-router`, `bellona/elysia`, `bellona/effect`.
- Specifier catalog on the package root (`plugins.js`, `plugins.react`, and the other keys).
- Consumer agent skill under `skills/bellona/`.

[Unreleased]: https://github.com/DobroslavRadosavljevic/bellona/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/DobroslavRadosavljevic/bellona/releases/tag/v0.1.0
