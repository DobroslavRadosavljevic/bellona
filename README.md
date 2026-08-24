# bellona

[![npm](https://img.shields.io/npm/v/bellona.svg)](https://www.npmjs.com/package/bellona)
[![license](https://img.shields.io/npm/l/bellona.svg)](./LICENSE)
[![skills.sh](https://skills.sh/b/DobroslavRadosavljevic/bellona)](https://skills.sh/DobroslavRadosavljevic/bellona)

**Opt-in [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) JS plugins** for TypeScript, React, Base UI, Zod, TanStack Router, Elysia, and Effect.

Load only the stacks you use. Turn rules on by id. Nothing is enabled by default.

> Oxlint JS plugins are still **alpha** (outside Oxlint semver). Pin `oxlint` to `^1.78` next to bellona.

## Features

- ⚡ Built for **Oxlint JS plugins** — fast lint, same config you already use
- 🔌 **One subpath per stack** — install one package, load `bellona/react` or `bellona/effect` only when you need it
- 🎛️ **Fully opt-in** — no recommended preset; you pick each `bellona/<plugin>-<rule>` id
- 🛡️ TypeScript **evidence** rules (widening, `unknown`, unsafe dictionaries, mocks, assertions)
- ⚛️ React file and JSX rules, plus Base UI `nativeButton` / `render` checks
- 🧭 Zod, TanStack Router, Elysia, and Effect v4 style and API rules

## Plugins

| Package subpath           | When to load                        |
| ------------------------- | ----------------------------------- |
| `bellona/js`              | TypeScript / JavaScript evidence    |
| `bellona/react`           | React components, hooks, JSX        |
| `bellona/base-ui`         | Base UI `nativeButton` and `render` |
| `bellona/zod`             | Zod 4 schemas                       |
| `bellona/tanstack-router` | TanStack Router / Start             |
| `bellona/elysia`          | Elysia HTTP apps                    |
| `bellona/effect`          | Effect v4 (`effect@rc`)             |

Rule ids are `<plugin>/<rule>`, for example `bellona/js-max-classes` and `bellona/effect-prefer-fn`.

## Install

```sh
bun add -D bellona oxlint
```

npm, pnpm, and yarn work too. Peer: `oxlint` `^1.78.0`. Node: `^20.19.0 || >=22.12.0`.

## Quick start

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: [
    'bellona/js',
    'bellona/react',
    'bellona/base-ui',
    'bellona/zod',
    'bellona/tanstack-router',
    'bellona/elysia',
    'bellona/effect',
  ],
  rules: {
    'bellona/js-max-classes': ['error', { max: 5 }],
    'bellona/react-no-namespace': 'error',
    'bellona/base-ui-require-native-button-with-render': 'error',
    'bellona/zod-schema-naming': 'error',
    'bellona/tanstack-router-no-dynamic-to': 'error',
    'bellona/tanstack-router-require-hook-from': 'error',
    'bellona/elysia-no-context-param': 'error',
    'bellona/effect-prefer-fn': 'error',
  },
});
```

Omit a subpath you do not use. Loading a plugin does not turn its rules on — you still set each id in `rules`.

Many domain rules skip test and spec files. Most of them also skip files that never import that stack. Pass `allow` as a list of path substrings to skip extra files.

## Rules

### `bellona/js`

- `js-max-classes`
- `js-no-chained-type-assertions`
- `js-no-conditional-empty-object-spread`
- `js-no-known-value-widening`
- `js-no-module-mocking`
- `js-no-object-parameters`
- `js-no-reflect-apply`
- `js-no-reflect-get`
- `js-no-runtime-typeof` (`allowInTypeGuards`, default `false`)
- `js-no-shape-in-symbol-names` (`term`, `caseSensitive`; matching is case-insensitive by default)
- `js-no-unknown-parameters` (`allow`, default `["cause"]`)
- `js-no-unknown-returns`
- `js-no-unknown-type-aliases`
- `js-no-unsafe-dictionary-type`
- `js-no-widen-then-assert`
- `js-require-safety-comment-for-type-assertion` (`marker`, default `SAFETY`)

```ts
rules: {
  'bellona/js-no-chained-type-assertions': 'error',
  'bellona/js-no-runtime-typeof': ['error', { allowInTypeGuards: false }],
  'bellona/js-no-unknown-parameters': ['error', { allow: ['cause'] }],
  'bellona/js-no-shape-in-symbol-names': ['error', { term: 'shape', caseSensitive: false }],
  'bellona/js-require-safety-comment-for-type-assertion': ['error', { marker: 'SAFETY' }],
}
```

### `bellona/react`

Most of these apply to `.tsx` / `.jsx`. Test and spec files are skipped.

- `react-component-file-name-match`
- `react-hook-file-name-match`
- `react-no-jsx-iife-in-components`
- `react-no-jsx-local-constants-in-components`
- `react-no-jsx-module-constants`
- `react-no-jsx-variable-reassignment-in-components`
- `react-no-multi-component-files`
- `react-no-multi-hook-files`
- `react-no-native-html` (`tags`, optional `replacements` map of `{ component, from }`)
- `react-no-namespace`
- `react-no-render-helper-functions-in-components`

### `bellona/base-ui`

- `base-ui-require-native-button-with-render` (`components`, `nonNativeButtonComponents`, `buttonHosts`, `nonButtonHosts`, `requireExplicitWhenUnknown`)

`components` and `nonNativeButtonComponents` replace the default part lists. `buttonHosts` and `nonButtonHosts` add names to the built-in `render` host lists. The rule matches JSX names (`Dialog.Trigger` or `DialogTrigger`) and does not require an `@base-ui/react` import.

### `bellona/zod`

Test and spec files are skipped.

- `zod-modern-format-validators`
- `zod-schema-naming`

### `bellona/tanstack-router`

Test and spec files are skipped.

- `tanstack-router-create-route-property-order`
- `tanstack-router-no-dynamic-to`
- `tanstack-router-no-get-route-api`
- `tanstack-router-no-hooks-in-route-lifecycle`
- `tanstack-router-no-imperative-location-navigation`
- `tanstack-router-no-relative-to-without-from`
- `tanstack-router-no-href`
- `tanstack-router-no-type-assertion`
- `tanstack-router-no-search-in-loader`
- `tanstack-router-require-params-with-path-tokens`
- `tanstack-router-require-hook-from`
- `tanstack-router-require-throw-not-found`
- `tanstack-router-require-throw-redirect`
- `tanstack-router-require-validate-search-when-used`

### `bellona/elysia`

Test and spec files are skipped. Files that do not import `elysia` are skipped except `elysia-no-route-factory`.

- `elysia-no-context-param`
- `elysia-no-controller-context-class`
- `elysia-no-cookie-undefined-check`
- `elysia-no-functional-plugin-callback`
- `elysia-no-route-factory` (`patterns`; `modules/` or `routes/` only)
- `elysia-one-route-method-per-file` (`routes/` leaf files)
- `elysia-prefer-resolve-for-auth` (`/plugins/` paths)
- `elysia-prefer-status-helper`
- `elysia-prefer-throw-status`
- `elysia-require-error-body-literal`
- `elysia-require-plugin-name` (also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts`)
- `elysia-require-response-schema` (`requireAllRoutes`, default `true`)
- `elysia-require-route-export-name` (`routes/` leaf files)
- `elysia-require-route-schema` (`methods`, default `post`/`put`/`patch`)
- `elysia-routes-index-mount-only` (`routes/index` files)

### `bellona/effect`

Files that do not import `effect`, `effect/*`, or `@effect/*` are skipped. Some style rules also skip test files (marked below).

- `effect-no-v3-apis`
- `effect-no-v3-imports`
- `effect-no-v3-service-tags`
- `effect-prefer-fn`
- `effect-require-fn-name`
- `effect-no-pipe-on-fn`
- `effect-no-try-catch-in-gen`
- `effect-no-throw-in-gen`
- `effect-require-return-yield-on-fail`
- `effect-schema-union-array`
- `effect-prefer-date-from-string`
- `effect-prefer-decode-unknown`
- `effect-no-it-scoped`
- `effect-no-run-promise-in-modules` (`entry`, default `/main.ts` `/server.ts` `/index.ts` `/app.ts` `/runtime.ts`; test files skipped)
- `effect-require-service-id-path` (test files skipped)
- `effect-require-service-static-layer` (test files skipped)
- `effect-prefer-service-of` (test files skipped)
- `effect-no-date-now` (test files skipped)
- `effect-prefer-clock-sleep` (test files skipped)
- `effect-prefer-schema-tagged-error` (test files skipped)
- `effect-prefer-try-promise` (test files skipped)
- `effect-prefer-predicate` (test files skipped)
- `effect-no-yield-ref-handle`
- `effect-prefer-vitest` (test files only)
- `effect-schema-no-legacy-filter`

## Agent skill

Coding agents can install the bellona skill from [skills.sh](https://www.skills.sh/):

```sh
npx skills add DobroslavRadosavljevic/bellona --skill bellona
```

Use `--skill bellona` so only this skill is installed.

## License

[MIT](./LICENSE)
