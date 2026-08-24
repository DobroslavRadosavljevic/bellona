# bellona

[![npm](https://img.shields.io/npm/v/bellona.svg)](https://www.npmjs.com/package/bellona)
[![license](https://img.shields.io/npm/l/bellona.svg)](./LICENSE)
[![skills.sh](https://skills.sh/b/DobroslavRadosavljevic/bellona)](https://skills.sh/DobroslavRadosavljevic/bellona)

**Opt-in [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) JS plugins** for TypeScript, React, Base UI, Zod, TanStack Router, Elysia, Effect, and Tailwind.

Load only the stacks you use. Turn rules on by id. Nothing is enabled by default.

> Oxlint JS plugins are still **alpha** (outside Oxlint semver). Pin `oxlint` to `^1.78` next to bellona.

## Features

- ⚡ Built for **Oxlint JS plugins** — fast lint, same config you already use
- 🔌 **One subpath per stack** — install one package, load `bellona/react` or `bellona/effect` only when you need it
- 🎛️ **Fully opt-in** — no recommended preset; you pick each `bl-<plugin>/<rule>` id
- 🛡️ TypeScript **evidence** rules (widening, `unknown`, unsafe dictionaries, mocks, assertions)
- ⚛️ React file and JSX rules, plus Base UI `nativeButton` / `render` checks
- 🧭 Zod, TanStack Router, Elysia, Effect v4, and Tailwind class-name rules

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
| `bellona/tailwind`        | Tailwind class strings              |

Rule ids are `bl-<plugin>/<rule>`, for example `bl-js/max-classes` and `bl-effect/prefer-fn`.

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
    'bellona/tailwind',
  ],
  rules: {
    'bl-js/max-classes': ['error', { max: 5 }],
    'bl-react/no-namespace': 'error',
    'bl-base-ui/require-native-button-with-render': 'error',
    'bl-zod/schema-naming': 'error',
    'bl-tanstack-router/no-dynamic-to': 'error',
    'bl-tanstack-router/require-hook-from': 'error',
    'bl-elysia/no-context-param': 'error',
    'bl-effect/prefer-fn': 'error',
    'bl-tailwind/no-classname-constants': 'error',
  },
});
```

Omit a subpath you do not use. Loading a plugin does not turn its rules on — you still set each id in `rules`.

Many domain rules skip test and spec files. Most of them also skip files that never import that stack. Pass `allow` as a list of path substrings to skip extra files.

## Rules

### `bellona/js`

- `bl-js/max-classes`
- `bl-js/no-chained-type-assertions`
- `bl-js/no-conditional-empty-object-spread`
- `bl-js/no-known-value-widening`
- `bl-js/no-module-mocking`
- `bl-js/no-object-parameters`
- `bl-js/no-reflect-apply`
- `bl-js/no-reflect-get`
- `bl-js/no-runtime-typeof` (`allowInTypeGuards`, default `false`)
- `bl-js/no-shape-in-symbol-names` (`term`, `caseSensitive`; matching is case-insensitive by default)
- `bl-js/no-unknown-parameters` (`allow`, default `["cause"]`)
- `bl-js/no-unknown-returns`
- `bl-js/no-unknown-type-aliases`
- `bl-js/no-unsafe-dictionary-type`
- `bl-js/no-widen-then-assert`
- `bl-js/require-safety-comment-for-type-assertion` (`marker`, default `SAFETY`)

```ts
rules: {
  'bl-js/no-chained-type-assertions': 'error',
  'bl-js/no-runtime-typeof': ['error', { allowInTypeGuards: false }],
  'bl-js/no-unknown-parameters': ['error', { allow: ['cause'] }],
  'bl-js/no-shape-in-symbol-names': ['error', { term: 'shape', caseSensitive: false }],
  'bl-js/require-safety-comment-for-type-assertion': ['error', { marker: 'SAFETY' }],
}
```

### `bellona/react`

Most of these apply to `.tsx` / `.jsx`. Test and spec files are skipped.

- `bl-react/component-file-name-match`
- `bl-react/component-props-type`
- `bl-react/hook-file-name-match`
- `bl-react/no-jsx-iife-in-components`
- `bl-react/no-jsx-local-constants-in-components`
- `bl-react/no-jsx-module-constants`
- `bl-react/no-jsx-variable-reassignment-in-components`
- `bl-react/no-multi-component-files`
- `bl-react/no-multi-hook-files`
- `bl-react/no-native-html` (`tags`, optional `replacements` map of `{ component, from }`)
- `bl-react/no-namespace`
- `bl-react/no-render-helper-functions-in-components`

### `bellona/base-ui`

- `bl-base-ui/require-native-button-with-render` (`components`, `nonNativeButtonComponents`, `buttonHosts`, `nonButtonHosts`, `requireExplicitWhenUnknown`)

`components` and `nonNativeButtonComponents` replace the default part lists. `buttonHosts` and `nonButtonHosts` add names to the built-in `render` host lists. The rule matches JSX names (`Dialog.Trigger` or `DialogTrigger`) and does not require an `@base-ui/react` import.

### `bellona/zod`

Test and spec files are skipped.

- `bl-zod/modern-format-validators`
- `bl-zod/schema-naming`

### `bellona/tanstack-router`

Test and spec files are skipped.

- `bl-tanstack-router/create-route-property-order`
- `bl-tanstack-router/no-dynamic-to`
- `bl-tanstack-router/no-get-route-api`
- `bl-tanstack-router/no-hooks-in-route-lifecycle`
- `bl-tanstack-router/no-imperative-location-navigation`
- `bl-tanstack-router/no-relative-to-without-from`
- `bl-tanstack-router/no-href`
- `bl-tanstack-router/no-type-assertion`
- `bl-tanstack-router/no-search-in-loader`
- `bl-tanstack-router/require-params-with-path-tokens`
- `bl-tanstack-router/require-hook-from`
- `bl-tanstack-router/require-throw-not-found`
- `bl-tanstack-router/require-throw-redirect`
- `bl-tanstack-router/require-validate-search-when-used`

### `bellona/elysia`

Test and spec files are skipped. Files that do not import `elysia` are skipped except `bl-elysia/no-route-factory`.

- `bl-elysia/no-context-param`
- `bl-elysia/no-controller-context-class`
- `bl-elysia/no-cookie-undefined-check`
- `bl-elysia/no-functional-plugin-callback`
- `bl-elysia/no-route-factory` (`patterns`; `modules/` or `routes/` only)
- `bl-elysia/one-route-method-per-file` (`routes/` leaf files)
- `bl-elysia/prefer-resolve-for-auth` (`/plugins/` paths)
- `bl-elysia/prefer-status-helper`
- `bl-elysia/prefer-throw-status`
- `bl-elysia/require-error-body-literal`
- `bl-elysia/require-plugin-name` (also skips `/main.ts`, `/server.ts`, `/index.ts`, `/app.ts`)
- `bl-elysia/require-response-schema` (`requireAllRoutes`, default `true`)
- `bl-elysia/require-route-export-name` (`routes/` leaf files)
- `bl-elysia/require-route-schema` (`methods`, default `post`/`put`/`patch`)
- `bl-elysia/routes-index-mount-only` (`routes/index` files)

### `bellona/effect`

Files that do not import `effect`, `effect/*`, or `@effect/*` are skipped. Some style rules also skip test files (marked below).

- `bl-effect/no-v3-apis`
- `bl-effect/no-v3-imports`
- `bl-effect/no-v3-service-tags`
- `bl-effect/prefer-fn`
- `bl-effect/require-fn-name`
- `bl-effect/no-pipe-on-fn`
- `bl-effect/no-try-catch-in-gen`
- `bl-effect/no-throw-in-gen`
- `bl-effect/require-return-yield-on-fail`
- `bl-effect/schema-union-array`
- `bl-effect/prefer-date-from-string`
- `bl-effect/prefer-decode-unknown`
- `bl-effect/no-it-scoped`
- `bl-effect/no-run-promise-in-modules` (`entry`, default `/main.ts` `/server.ts` `/index.ts` `/app.ts` `/runtime.ts`; test files skipped)
- `bl-effect/require-service-id-path` (test files skipped)
- `bl-effect/require-service-static-layer` (test files skipped)
- `bl-effect/prefer-service-of` (test files skipped)
- `bl-effect/no-date-now` (test files skipped)
- `bl-effect/prefer-clock-sleep` (test files skipped)
- `bl-effect/prefer-schema-tagged-error` (test files skipped)
- `bl-effect/prefer-try-promise` (test files skipped)
- `bl-effect/prefer-predicate` (test files skipped)
- `bl-effect/no-yield-ref-handle`
- `bl-effect/prefer-vitest` (test files only)
- `bl-effect/schema-no-legacy-filter`

### `bellona/tailwind`

No import gate. Test and spec files are skipped. Prefer `tv` / `createTV` from tailwind-variants, or a reusable component.

- `bl-tailwind/no-classname-constants` (`minUtilities`, default `2`; `allowedCallees`, default `tv` / `createTV`)

## Agent skill

Coding agents can install the bellona skill from [skills.sh](https://www.skills.sh/):

```sh
npx skills add DobroslavRadosavljevic/bellona --skill bellona
```

Use `--skill bellona` so only this skill is installed.

## License

[MIT](./LICENSE)
