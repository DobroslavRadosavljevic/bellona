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
- 🎛️ **Fully opt-in** — no recommended preset; you pick each `bn-*` rule
- 🛡️ TypeScript **evidence** rules (widening, `unknown`, unsafe dictionaries, mocks, assertions)
- ⚛️ React file and JSX rules, plus Base UI `nativeButton` / `render` checks
- 🧭 Zod, TanStack Router, Elysia, and Effect v4 style and API rules

## Plugins

| Package subpath          | When to load                        |
| ------------------------ | ----------------------------------- |
| `bellona/js`              | TypeScript / JavaScript evidence    |
| `bellona/react`           | React components, hooks, JSX        |
| `bellona/base-ui`         | Base UI `nativeButton` and `render` |
| `bellona/zod`             | Zod 4 schemas                       |
| `bellona/tanstack-router` | TanStack Router / Start             |
| `bellona/elysia`          | Elysia HTTP apps                    |
| `bellona/effect`          | Effect v4 (`effect@rc`)             |

Rule ids are `<plugin>/<rule>`, for example `js/bn-max-classes` and `effect/bn-prefer-effect-fn`.

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
    'js/bn-max-classes': ['error', { max: 5 }],
    'react/bn-no-react-namespace': 'error',
    'base-ui/bn-require-native-button-with-render': 'error',
    'zod/bn-zod-schema-naming': 'error',
    'tanstack-router/bn-no-dynamic-router-to': 'error',
    'tanstack-router/bn-require-router-hook-from': 'error',
    'elysia/bn-no-context-param': 'error',
    'effect/bn-prefer-effect-fn': 'error',
  },
});
```

Omit a subpath you do not use. Loading a plugin does not turn its rules on — you still set each id in `rules`.

Many domain rules skip test and spec files. Most of them also skip files that never import that stack. Pass `allow` as a list of path substrings to skip extra files.

## Rules

### `bellona/js`

- `bn-max-classes`
- `bn-no-chained-type-assertions`
- `bn-no-conditional-empty-object-spread`
- `bn-no-known-value-widening`
- `bn-no-module-mocking`
- `bn-no-object-parameters`
- `bn-no-reflect-apply`
- `bn-no-reflect-get`
- `bn-no-runtime-typeof` (`allowInTypeGuards`, default `false`)
- `bn-no-shape-in-symbol-names` (`term`, `caseSensitive`; matching is case-insensitive by default)
- `bn-no-unknown-parameters` (`allow`, default `["cause"]`)
- `bn-no-unknown-returns`
- `bn-no-unknown-type-aliases`
- `bn-no-unsafe-dictionary-type`
- `bn-no-widen-then-assert`
- `bn-require-safety-comment-for-type-assertion` (`marker`, default `SAFETY`)

```ts
rules: {
  'js/bn-no-chained-type-assertions': 'error',
  'js/bn-no-runtime-typeof': ['error', { allowInTypeGuards: false }],
  'js/bn-no-unknown-parameters': ['error', { allow: ['cause'] }],
  'js/bn-no-shape-in-symbol-names': ['error', { term: 'shape', caseSensitive: false }],
  'js/bn-require-safety-comment-for-type-assertion': ['error', { marker: 'SAFETY' }],
}
```

### `bellona/react`

Most of these apply to `.tsx` / `.jsx`. Test and spec files are skipped.

- `bn-component-file-name-match`
- `bn-hook-file-name-match`
- `bn-no-jsx-iife-in-components`
- `bn-no-jsx-local-constants-in-components`
- `bn-no-jsx-module-constants`
- `bn-no-jsx-variable-reassignment-in-components`
- `bn-no-multi-component-files`
- `bn-no-multi-hook-files`
- `bn-no-native-html` (`tags`, optional `replacements` map of `{ component, from }`)
- `bn-no-react-namespace`
- `bn-no-render-helper-functions-in-components`

### `bellona/base-ui`

- `bn-require-native-button-with-render` (`components`, `nonNativeButtonComponents`, `buttonHosts`, `nonButtonHosts`, `requireExplicitWhenUnknown`)

`components` and `nonNativeButtonComponents` replace the default part lists. `buttonHosts` and `nonButtonHosts` add names to the built-in `render` host lists. The rule matches JSX names (`Dialog.Trigger` or `DialogTrigger`) and does not require an `@base-ui/react` import.

### `bellona/zod`

Test and spec files are skipped.

- `bn-zod-modern-format-validators`
- `bn-zod-schema-naming`

### `bellona/tanstack-router`

Test and spec files are skipped.

- `bn-create-route-property-order`
- `bn-no-dynamic-router-to`
- `bn-no-get-route-api`
- `bn-no-hooks-in-route-lifecycle`
- `bn-no-imperative-location-navigation`
- `bn-no-relative-router-to-without-from`
- `bn-no-router-href`
- `bn-no-router-type-assertion`
- `bn-no-search-in-loader`
- `bn-require-params-with-path-tokens`
- `bn-require-router-hook-from`
- `bn-require-throw-not-found`
- `bn-require-throw-redirect`
- `bn-require-validate-search-when-used`

### `bellona/elysia`

Test and spec files are skipped. Files that do not import `elysia` are skipped except `bn-no-route-factory`.

- `bn-no-context-param`
- `bn-no-controller-context-class`
- `bn-no-cookie-undefined-check`
- `bn-no-functional-plugin-callback`
- `bn-no-route-factory` (`patterns`; `modules/` or `routes/` only)
- `bn-one-route-method-per-file` (`routes/` leaf files)
- `bn-prefer-resolve-for-auth` (`/plugins/` paths)
- `bn-prefer-status-helper`
- `bn-prefer-throw-status`
- `bn-require-error-body-literal`
- `bn-require-plugin-name` (also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts`)
- `bn-require-response-schema` (`requireAllRoutes`, default `true`)
- `bn-require-route-export-name` (`routes/` leaf files)
- `bn-require-route-schema` (`methods`, default `post`/`put`/`patch`)
- `bn-routes-index-mount-only` (`routes/index` files)

### `bellona/effect`

Files that do not import `effect`, `effect/*`, or `@effect/*` are skipped. Some style rules also skip test files (marked below).

- `bn-no-v3-effect-apis`
- `bn-no-v3-imports`
- `bn-no-v3-service-tags`
- `bn-prefer-effect-fn`
- `bn-require-effect-fn-name`
- `bn-no-pipe-on-effect-fn`
- `bn-no-try-catch-in-effect-gen`
- `bn-no-throw-in-effect-gen`
- `bn-require-return-yield-on-fail`
- `bn-schema-union-array`
- `bn-prefer-date-from-string`
- `bn-prefer-decode-unknown-effect`
- `bn-no-it-effect-scoped`
- `bn-no-run-promise-in-modules` (`entry`, default `/main.ts` `/server.ts` `/index.ts` `/app.ts` `/runtime.ts`; test files skipped)
- `bn-require-service-id-path` (test files skipped)
- `bn-require-service-static-layer` (test files skipped)
- `bn-prefer-service-of` (test files skipped)
- `bn-no-date-now-in-effect` (test files skipped)
- `bn-prefer-clock-sleep` (test files skipped)
- `bn-prefer-schema-tagged-error` (test files skipped)
- `bn-prefer-try-promise` (test files skipped)
- `bn-prefer-predicate` (test files skipped)
- `bn-no-yield-ref-handle`
- `bn-prefer-effect-vitest` (test files only)
- `bn-schema-no-legacy-filter`

## Agent skill

Coding agents can install the bellona skill from [skills.sh](https://www.skills.sh/):

```sh
npx skills add DobroslavRadosavljevic/bellona --skill bellona
```

Use `--skill bellona` so only this skill is installed.

## License

[MIT](./LICENSE)
