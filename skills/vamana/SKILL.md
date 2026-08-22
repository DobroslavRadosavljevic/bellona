---
name: vamana
description: >-
  Install, configure, and enable vamana Oxlint JS plugins (vamana/js, vamana/react,
  vamana/base-ui, vamana/zod, vamana/tanstack-router, vamana/elysia, vamana/effect).
  Use when adding oxlint.config.ts jsPlugins, turning on vm-* rules, debugging vamana
  lint, writing a new vamana rule with defineVamanaRule and createOnce, pinning oxlint
  for JS plugins, or when the user mentions vamana, Oxlint JS plugins, vm-max-classes,
  vm-prefer-effect-fn, vm-no-native-html, or opt-in Oxlint plugins.
---

# Vamana

Vamana is a set of **opt-in Oxlint JS plugins**. Install the package, load only the subpaths you need, then turn rules on by id. **Nothing is enabled by default.** There is no recommended config.

JS plugins are **alpha** in Oxlint (outside semver). Pin `oxlint` in the consuming app to the same minor as vamana’s peer (`oxlint` ^1.78).

Use this skill when the work is: install/config, enable/tune `vm-*` rules, interpret a vamana diagnostic, write code that satisfies a rule, or add a plugin/rule to the vamana package itself.

## Workflow

1. Inspect the consumer (or this repo) before changing lint:
   - `oxlint` and `vamana` versions; Node `^20.19.0 || >=22.12.0`.
   - Config file: prefer `oxlint.config.ts` + `defineConfig`. Also accept `.oxlintrc.json(c)`.
   - Existing `jsPlugins`, `rules`, `ignorePatterns`, and `lint` / `lint:fix` scripts.
   - Which stacks the app actually uses (React, Base UI, Zod, TanStack Router, Elysia, Effect). Load only those subpaths.
2. Install and wire plugins using [setup.md](references/setup.md).
3. Enable rules **explicitly**. Copy ids from the plugin catalogs below. Do not invent a `vamana/recommended` preset.
4. Match skip behavior and options in the catalog for that plugin. Shared `allow` / test-file rules live in [how-it-works.md](references/how-it-works.md).
5. For a diagnostic: read the rule entry, apply the “prefer” snippet, then re-run the narrowest `oxlint` path.
6. When changing the vamana **package** (new plugin or rule), follow [authoring.md](references/authoring.md). Do not treat that path as consumer work.

## Core judgment

- Subpath import = plugin load. Rule id = `<plugin-name>/vm-<slug>` (example: `js/vm-max-classes`). Plugin `meta.name` is the last export segment: `js`, `react`, `base-ui`, `zod`, `tanstack-router`, `elysia`, `effect`.
- The root `vamana` entry is a **specifier catalog only** (`plugins.js`, `plugins.react`, …). Consumers put those strings in `jsPlugins`. They do not import a plugin from `vamana`.
- Rules ship **off**. Loading a plugin does not lint until you set the rule in `rules`.
- Prefer `schema` + `defaultOptions`. Options are a single object at index `0`.
- `allow` is a list of path substrings (and basename matches when the entry contains `.`). It skips the file. It is not a per-symbol allowlist.
- Domain plugins (react / zod / tanstack-router / elysia / most effect style rules) also skip test/spec/stories files. See each catalog.
- Zod / TanStack Router / Elysia / Effect rules skip files that do not import the matching package (Elysia `vm-no-route-factory` is the exception: path-gated, no import required).
- Do not publish ESLint compatibility. Do not treat Oxlint as a formatter (use Oxfmt or another formatter).
- Do not wrap vamana rules in `eslintCompatPlugin`. Published rules use `createOnce` only.

## Plugins

| Subpath | `meta.name` | Enable when the app uses | Catalog |
| --- | --- | --- | --- |
| `vamana/js` | `js` | TS/JS evidence, mocks, class count | [js-rules.md](references/js-rules.md) |
| `vamana/react` | `react` | React components/hooks/JSX | [react-rules.md](references/react-rules.md) |
| `vamana/base-ui` | `base-ui` | Base UI `nativeButton` + `render` | [base-ui-rules.md](references/base-ui-rules.md) |
| `vamana/zod` | `zod` | Zod 4 schemas | [zod-rules.md](references/zod-rules.md) |
| `vamana/tanstack-router` | `tanstack-router` | TanStack Router / Start | [tanstack-router-rules.md](references/tanstack-router-rules.md) |
| `vamana/elysia` | `elysia` | Elysia HTTP apps | [elysia-rules.md](references/elysia-rules.md) |
| `vamana/effect` | `effect` | Effect v4 (`effect@rc`) | [effect-rules.md](references/effect-rules.md) |

Omit a subpath if that stack is not in the repo.

## Minimal config

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: ['vamana/js'],
  rules: {
    'js/vm-max-classes': ['error', { max: 5 }],
  },
});
```

Full install, `allow` examples, disable comments, and an “enable many rules” paste: [setup.md](references/setup.md).

## How it works (short)

Oxlint loads each `jsPlugins` specifier as a JS plugin object `{ meta: { name }, rules }`. Vamana builds that object with `defineVamanaPlugin`. Each rule is `defineVamanaRule` + `createOnce`. `createOnce` runs once per process; visitors and `before()` run per file. Read options inside visitors/`before` via `objectOptionAt(context, 0)`, never from the `createOnce` closure.

Details, skip helpers, and the published export map: [how-it-works.md](references/how-it-works.md).

## Verification

Prefer the consumer’s scripts. For meaningful vamana work:

- `bunx oxlint` (or `bun run lint`) on changed paths after enabling or fixing a rule.
- `bunx oxlint --fix` only when the rule actually has a fix (most vamana rules do not).
- After config edits, confirm the rule id is `<name>/vm-<slug>` and the plugin is in `jsPlugins`.
- If a file is “silently clean”: check import skip, test-file skip, `allow`, and that the rule is not still off.

When changing the vamana package: focused Vitest on that plugin, then `bun run check`. See [authoring.md](references/authoring.md).

If Oxlint fails to load a plugin, or a rule never fires: [troubleshooting.md](references/troubleshooting.md).

## Additional resources

- Setup, ids, options shape: [setup.md](references/setup.md)
- Architecture and skip rules: [how-it-works.md](references/how-it-works.md)
- New plugin/rule in this repo: [authoring.md](references/authoring.md)
- Load failures and silent skips: [troubleshooting.md](references/troubleshooting.md)
- Oxlint JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html
- Human consumer README in this repo: `README.md`
