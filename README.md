# vamana

[![npm](https://img.shields.io/npm/v/vamana.svg)](https://www.npmjs.com/package/vamana)
[![license](https://img.shields.io/npm/l/vamana.svg)](./LICENSE)
[![skills.sh](https://skills.sh/b/DobroslavRadosavljevic/vamana)](https://skills.sh/DobroslavRadosavljevic/vamana)

**Opt-in [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) JS plugins** for TypeScript, React, Base UI, Zod, TanStack Router, Elysia, and Effect.

Load only the stacks you use. Turn rules on by id. Nothing is enabled by default.

> Oxlint JS plugins are still **alpha** (outside Oxlint semver). Pin `oxlint` to `^1.78` next to vamana.

## Features

- ⚡ Built for **Oxlint JS plugins** — fast lint, same config you already use
- 🔌 **One subpath per stack** — install one package, load `vamana/react` or `vamana/effect` only when you need it
- 🎛️ **Fully opt-in** — no recommended preset; you pick each `vm-*` rule
- 🛡️ TypeScript **evidence** rules (widening, `unknown`, unsafe dictionaries, mocks, assertions)
- ⚛️ React file and JSX rules, plus Base UI `nativeButton` / `render` checks
- 🧭 Zod, TanStack Router, Elysia, and Effect v4 style and API rules

## Plugins

| Package subpath          | When to load                        |
| ------------------------ | ----------------------------------- |
| `vamana/js`              | TypeScript / JavaScript evidence    |
| `vamana/react`           | React components, hooks, JSX        |
| `vamana/base-ui`         | Base UI `nativeButton` and `render` |
| `vamana/zod`             | Zod 4 schemas                       |
| `vamana/tanstack-router` | TanStack Router / Start             |
| `vamana/elysia`          | Elysia HTTP apps                    |
| `vamana/effect`          | Effect v4 (`effect@rc`)             |

Rule ids are `<plugin>/<rule>`, for example `js/vm-max-classes` and `effect/vm-prefer-effect-fn`.

## Install

```sh
bun add -D vamana oxlint
```

npm, pnpm, and yarn work too. Peer: `oxlint` `^1.78.0`. Node: `^20.19.0 || >=22.12.0`.

## Quick start

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: [
    'vamana/js',
    'vamana/react',
    'vamana/base-ui',
    'vamana/zod',
    'vamana/tanstack-router',
    'vamana/elysia',
    'vamana/effect',
  ],
  rules: {
    'js/vm-max-classes': ['error', { max: 5 }],
    'react/vm-no-react-namespace': 'error',
    'base-ui/vm-require-native-button-with-render': 'error',
    'zod/vm-zod-schema-naming': 'error',
    'tanstack-router/vm-no-dynamic-router-to': 'error',
    'tanstack-router/vm-require-router-hook-from': 'error',
    'elysia/vm-no-context-param': 'error',
    'effect/vm-prefer-effect-fn': 'error',
  },
});
```

Omit a subpath you do not use. Loading a plugin does not turn its rules on — you still set each id in `rules`.

Many domain rules skip test and spec files. Most of them also skip files that never import that stack. Pass `allow` as a list of path substrings to skip extra files.

## Rules

### `vamana/js`

- `vm-max-classes`
- `vm-no-chained-type-assertions`
- `vm-no-conditional-empty-object-spread`
- `vm-no-known-value-widening`
- `vm-no-module-mocking`
- `vm-no-object-parameters`
- `vm-no-reflect-apply`
- `vm-no-reflect-get`
- `vm-no-runtime-typeof` (`allowInTypeGuards`, default `false`)
- `vm-no-shape-in-symbol-names` (`term`, `caseSensitive`; matching is case-insensitive by default)
- `vm-no-unknown-parameters` (`allow`, default `["cause"]`)
- `vm-no-unknown-returns`
- `vm-no-unknown-type-aliases`
- `vm-no-unsafe-dictionary-type`
- `vm-no-widen-then-assert`
- `vm-require-safety-comment-for-type-assertion` (`marker`, default `SAFETY`)

```ts
rules: {
  'js/vm-no-chained-type-assertions': 'error',
  'js/vm-no-runtime-typeof': ['error', { allowInTypeGuards: false }],
  'js/vm-no-unknown-parameters': ['error', { allow: ['cause'] }],
  'js/vm-no-shape-in-symbol-names': ['error', { term: 'shape', caseSensitive: false }],
  'js/vm-require-safety-comment-for-type-assertion': ['error', { marker: 'SAFETY' }],
}
```

### `vamana/react`

Most of these apply to `.tsx` / `.jsx`. Test and spec files are skipped.

- `vm-component-file-name-match`
- `vm-hook-file-name-match`
- `vm-no-jsx-iife-in-components`
- `vm-no-jsx-local-constants-in-components`
- `vm-no-jsx-module-constants`
- `vm-no-jsx-variable-reassignment-in-components`
- `vm-no-multi-component-files`
- `vm-no-multi-hook-files`
- `vm-no-native-html` (`tags`, optional `replacements` map of `{ component, from }`)
- `vm-no-react-namespace`
- `vm-no-render-helper-functions-in-components`

### `vamana/base-ui`

- `vm-require-native-button-with-render` (`components`, `nonNativeButtonComponents`, `buttonHosts`, `nonButtonHosts`, `requireExplicitWhenUnknown`)

`components` and `nonNativeButtonComponents` replace the default part lists. `buttonHosts` and `nonButtonHosts` add names to the built-in `render` host lists. The rule matches JSX names (`Dialog.Trigger` or `DialogTrigger`) and does not require an `@base-ui/react` import.

### `vamana/zod`

Test and spec files are skipped.

- `vm-zod-modern-format-validators`
- `vm-zod-schema-naming`

### `vamana/tanstack-router`

Test and spec files are skipped.

- `vm-create-route-property-order`
- `vm-no-dynamic-router-to`
- `vm-no-get-route-api`
- `vm-no-hooks-in-route-lifecycle`
- `vm-no-imperative-location-navigation`
- `vm-no-relative-router-to-without-from`
- `vm-no-router-href`
- `vm-no-router-type-assertion`
- `vm-no-search-in-loader`
- `vm-require-params-with-path-tokens`
- `vm-require-router-hook-from`
- `vm-require-throw-not-found`
- `vm-require-throw-redirect`
- `vm-require-validate-search-when-used`

### `vamana/elysia`

Test and spec files are skipped. Files that do not import `elysia` are skipped except `vm-no-route-factory`.

- `vm-no-context-param`
- `vm-no-controller-context-class`
- `vm-no-cookie-undefined-check`
- `vm-no-functional-plugin-callback`
- `vm-no-route-factory` (`patterns`; `modules/` or `routes/` only)
- `vm-one-route-method-per-file` (`routes/` leaf files)
- `vm-prefer-resolve-for-auth` (`/plugins/` paths)
- `vm-prefer-status-helper`
- `vm-prefer-throw-status`
- `vm-require-error-body-literal`
- `vm-require-plugin-name` (also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts`)
- `vm-require-response-schema` (`requireAllRoutes`, default `true`)
- `vm-require-route-export-name` (`routes/` leaf files)
- `vm-require-route-schema` (`methods`, default `post`/`put`/`patch`)
- `vm-routes-index-mount-only` (`routes/index` files)

### `vamana/effect`

Files that do not import `effect`, `effect/*`, or `@effect/*` are skipped. Some style rules also skip test files (marked below).

- `vm-no-v3-effect-apis`
- `vm-no-v3-imports`
- `vm-no-v3-service-tags`
- `vm-prefer-effect-fn`
- `vm-require-effect-fn-name`
- `vm-no-pipe-on-effect-fn`
- `vm-no-try-catch-in-effect-gen`
- `vm-no-throw-in-effect-gen`
- `vm-require-return-yield-on-fail`
- `vm-schema-union-array`
- `vm-prefer-date-from-string`
- `vm-prefer-decode-unknown-effect`
- `vm-no-it-effect-scoped`
- `vm-no-run-promise-in-modules` (`entry`, default `/main.ts` `/server.ts` `/index.ts` `/app.ts` `/runtime.ts`; test files skipped)
- `vm-require-service-id-path` (test files skipped)
- `vm-require-service-static-layer` (test files skipped)
- `vm-prefer-service-of` (test files skipped)
- `vm-no-date-now-in-effect` (test files skipped)
- `vm-prefer-clock-sleep` (test files skipped)
- `vm-prefer-schema-tagged-error` (test files skipped)
- `vm-prefer-try-promise` (test files skipped)
- `vm-prefer-predicate` (test files skipped)
- `vm-no-yield-ref-handle`
- `vm-prefer-effect-vitest` (test files only)
- `vm-schema-no-legacy-filter`

## Agent skill

Coding agents can install the vamana skill from [skills.sh](https://www.skills.sh/):

```sh
npx skills add DobroslavRadosavljevic/vamana --skill vamana
```

Use `--skill vamana` so only this skill is installed.

## License

[MIT](./LICENSE)
