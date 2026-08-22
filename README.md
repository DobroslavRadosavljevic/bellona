# vamana

Opt-in [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) JS plugins. Install the package, add only the subpaths you need, then turn rules on by id. Nothing is enabled by default.

JS plugins are still **alpha** in Oxlint (outside semver). Pin `oxlint` in consuming apps.

## Install

```sh
bun add -D vamana oxlint
```

## Use

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
  ],
  rules: {
    'js/vm-max-classes': ['error', { max: 5 }],
    'react/vm-no-react-namespace': 'error',
    'base-ui/vm-require-native-button-with-render': 'error',
    'zod/vm-zod-schema-naming': 'error',
    'tanstack-router/vm-no-dynamic-router-to': 'error',
    'tanstack-router/vm-require-router-hook-from': 'error',
    'elysia/vm-no-context-param': 'error',
  },
});
```

Omit a subpath if you do not want that plugin loaded.

| Subpath                  | Plugin name       | Rules          |
| ------------------------ | ----------------- | -------------- |
| `vamana/js`              | `js`              | See list below |
| `vamana/react`           | `react`           | See list below |
| `vamana/base-ui`         | `base-ui`         | See list below |
| `vamana/zod`             | `zod`             | See list below |
| `vamana/tanstack-router` | `tanstack-router` | See list below |
| `vamana/elysia`          | `elysia`          | See list below |

`vamana/js` includes `vm-max-classes` and these TypeScript evidence rules:

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

Those rules stay **off** until you enable them:

```ts
rules: {
  'js/vm-no-chained-type-assertions': 'error',
  'js/vm-no-runtime-typeof': ['error', { allowInTypeGuards: false }],
  'js/vm-no-unknown-parameters': ['error', { allow: ['cause'] }],
  'js/vm-no-shape-in-symbol-names': ['error', { term: 'shape', caseSensitive: false }],
  'js/vm-require-safety-comment-for-type-assertion': ['error', { marker: 'SAFETY' }],
}
```

`vamana/react` rules (`allow` path substrings skip a file; test/spec files are skipped; most rules apply to `.tsx` / `.jsx`):

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

`vamana/base-ui` rules:

- `vm-require-native-button-with-render` (`components`, `requireExplicitWhenUnknown`)

`vamana/zod` rules (`allow` path substrings skip a file; test/spec files are skipped):

- `vm-zod-modern-format-validators`
- `vm-zod-schema-naming`

`vamana/tanstack-router` rules (`allow` path substrings skip a file; test/spec files are skipped):

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

`vamana/elysia` rules (`allow` path substrings skip a file; test/spec files are skipped; files that do not import `elysia` are skipped except `vm-no-route-factory`):

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

## Develop a rule

1. Add `src/plugins/<name>/rules/<rule>.ts` with `defineVamanaRule` + `createOnce`. Read options in visitors via `objectOptionAt`.
2. Register it in `src/plugins/<name>/index.ts`.
3. Test with `tests/unit/plugins/<name>/<rule>.test.ts` using the `vmRuleName` id.
4. `bun run test` then `bun run check`.
