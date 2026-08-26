---
name: bellona
description: >-
  Install, configure, and enable bellona 0.4.1 Oxlint JS plugins (bellona/js, bellona/react,
  bellona/base-ui, bellona/zod, bellona/tanstack-router, bellona/elysia, bellona/effect,
  bellona/tailwind). Follow Problem / Why / Fix / Avoid diagnostics. Use when adding
  oxlint.config.ts jsPlugins, turning on bl-* rules, debugging bellona lint, writing a
  new bellona rule with defineBellonaRule, createOnce, and agentDiagnostic, pinning oxlint
  for JS plugins, or when the user mentions bellona, Oxlint JS plugins, bl-js/max-classes,
  bl-js/no-useless-reexport, bl-js/no-inline-import-type, bl-react/component-props-type,
  bl-effect/prefer-fn, bl-react/no-native-html, bl-tailwind/no-classname-constants, or
  opt-in Oxlint plugins.
---

# Bellona

Bellona is a set of **opt-in Oxlint JS plugins** (this skill matches **bellona 0.4.1**: 8 plugins, 87 rules). Install the package, load only the subpaths you need, then turn rules on by id. **Nothing is enabled by default.** There is no recommended config.

JS plugins are **alpha** in Oxlint (outside semver). Pin `oxlint` in the consuming app to the same minor as bellona’s peer (`oxlint` ^1.78).

Use this skill when the work is: install/config, enable/tune `bl-<plugin>/*` rules, interpret a bellona diagnostic, write code that satisfies a rule, or add a plugin/rule to the bellona package itself.

## Workflow

1. Inspect the consumer (or this repo) before changing lint:
   - `oxlint` and `bellona` versions; Node `^20.19.0 || >=22.12.0`.
   - Config file: prefer `oxlint.config.ts` + `defineConfig`. Also accept `.oxlintrc.json(c)`.
   - Existing `jsPlugins`, `rules`, `ignorePatterns`, and `lint` / `lint:fix` scripts.
   - Which stacks the app actually uses (React, Base UI, Zod, TanStack Router, Elysia, Effect, Tailwind). Load only those subpaths.
2. Install and wire plugins using [setup.md](references/setup.md).
3. Enable rules **explicitly**. Copy ids from the plugin catalogs below. Do not invent a `bellona/recommended` preset.
4. Match skip behavior and options in the catalog for that plugin. Shared `allow` / test-file rules live in [how-it-works.md](references/how-it-works.md).
5. For a diagnostic: read the four lines (**Problem**, **Why**, **Fix**, **Avoid**). Apply **Fix**. Obey **Avoid**. Then re-run the narrowest `oxlint` path. Use the catalog only if the report is incomplete.
6. When changing the bellona **package** (new plugin or rule), follow [authoring.md](references/authoring.md). Do not treat that path as consumer work.

## Core judgment

- Subpath import = plugin load. Rule id = `bl-<plugin>/<slug>` (example: `bl-js/max-classes`). Plugin `meta.name` is unique: `bl-js`, `bl-react`, `bl-base-ui`, `bl-zod`, `bl-tanstack-router`, `bl-elysia`, `bl-effect`, `bl-tailwind`.
- The root `bellona` entry is a **specifier catalog only** (`plugins.js`, `plugins.react`, …). Consumers put those strings in `jsPlugins`. They do not import a plugin from `bellona`.
- Rules ship **off**. Loading a plugin does not lint until you set the rule in `rules`.
- Each report is four lines: **Problem**, **Why**, **Fix**, **Avoid**. Do the **Fix**. Do not add `oxlint-disable` unless the file is generated or listed in `allow`.
- Prefer `schema` + `defaultOptions`. Options are a single object at index `0`.
- `allow` is a list of path substrings (and basename matches when the entry contains `.`). It skips the file. It is not a per-symbol allowlist.
- Domain plugins (react / zod / tanstack-router / elysia / most effect style rules) also skip test/spec/stories files. See each catalog.
- Zod / TanStack Router / Elysia / Effect rules skip files that do not import the matching package (Elysia `bl-elysia/no-route-factory` is the exception: path-gated, no import required).
- Do not publish ESLint compatibility. Do not treat Oxlint as a formatter (use Oxfmt or another formatter).
- Do not wrap bellona rules in `eslintCompatPlugin`. Published rules use `createOnce` only.

## Plugins

| Subpath | `meta.name` | Enable when the app uses | Catalog |
| --- | --- | --- | --- |
| `bellona/js` | `bl-js` | TS/JS evidence, mocks, re-exports, class count | [js-rules.md](references/js-rules.md) |
| `bellona/react` | `bl-react` | React components/hooks/JSX | [react-rules.md](references/react-rules.md) |
| `bellona/base-ui` | `bl-base-ui` | Base UI `nativeButton` + `render` | [base-ui-rules.md](references/base-ui-rules.md) |
| `bellona/zod` | `bl-zod` | Zod 4 schemas | [zod-rules.md](references/zod-rules.md) |
| `bellona/tanstack-router` | `bl-tanstack-router` | TanStack Router / Start | [tanstack-router-rules.md](references/tanstack-router-rules.md) |
| `bellona/elysia` | `bl-elysia` | Elysia HTTP apps | [elysia-rules.md](references/elysia-rules.md) |
| `bellona/effect` | `bl-effect` | Effect v4 (`effect@rc`) | [effect-rules.md](references/effect-rules.md) |
| `bellona/tailwind` | `bl-tailwind` | Tailwind class strings | [tailwind-rules.md](references/tailwind-rules.md) |

Omit a subpath if that stack is not in the repo.

## Minimal config

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: ['bellona/js'],
  rules: {
    'bl-js/max-classes': ['error', { max: 5 }],
  },
});
```

Full install, `allow` examples, disable comments, and an “enable many rules” paste: [setup.md](references/setup.md).

## Diagnostics

Each lint report has four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**. Obey **Avoid**. Do not disable the rule for convenience. Details: [setup.md](references/setup.md#diagnostics).

## How it works (short)

Oxlint loads each `jsPlugins` specifier as a JS plugin object `{ meta: { name }, rules }`. Bellona builds that object with `defineBellonaPlugin`. Each rule is `defineBellonaRule` + `createOnce`. `createOnce` runs once per process; visitors and `before()` run per file. Read options inside visitors/`before` via `objectOptionAt(context, 0)`, never from the `createOnce` closure.

Details, skip helpers, and the published export map: [how-it-works.md](references/how-it-works.md).

## Verification

Prefer the consumer’s scripts. For meaningful bellona work:

- `bunx oxlint` (or `bun run lint`) on changed paths after enabling or fixing a rule.
- `bunx oxlint --fix` only when the rule actually has a fix (most bellona rules do not).
- After config edits, confirm the rule id is `bl-<plugin>/<slug>` and the plugin is in `jsPlugins`.
- If a file is “silently clean”: check import skip, test-file skip, `allow`, and that the rule is not still off.

When changing the bellona package: focused Vitest on that plugin, then `bun run check`. See [authoring.md](references/authoring.md).

If Oxlint fails to load a plugin, or a rule never fires: [troubleshooting.md](references/troubleshooting.md).

## Additional resources

- Setup, ids, options shape: [setup.md](references/setup.md)
- Architecture and skip rules: [how-it-works.md](references/how-it-works.md)
- New plugin/rule in this repo: [authoring.md](references/authoring.md)
- Load failures and silent skips: [troubleshooting.md](references/troubleshooting.md)
- Oxlint JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html
- Human consumer README in this repo: `README.md`
