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
  jsPlugins: ['vamana/js', 'vamana/tanstack-router'],
  rules: {
    'js/vm-max-classes': ['error', { max: 5 }],
    'tanstack-router/vm-no-dynamic-router-to': 'error',
    'tanstack-router/vm-require-router-hook-from': 'error',
  },
});
```

Omit a subpath if you do not want that plugin loaded.

| Subpath                  | Plugin name       | Rules          |
| ------------------------ | ----------------- | -------------- |
| `vamana/js`              | `js`              | See list below |
| `vamana/tanstack-router` | `tanstack-router` | See list below |

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

`vamana/tanstack-router` rules (`allow` path substrings skip a file; test/spec files are skipped):

- `vm-no-dynamic-router-to`
- `vm-no-get-route-api`
- `vm-no-imperative-location-navigation`
- `vm-no-relative-router-to-without-from`
- `vm-no-router-href`
- `vm-no-router-type-assertion`
- `vm-require-router-hook-from`

## Develop a rule

1. Add `src/plugins/<name>/rules/<rule>.ts` with `defineVamanaRule` + `createOnce`. Read options in visitors via `objectOptionAt`.
2. Register it in `src/plugins/<name>/index.ts`.
3. Test with `tests/unit/plugins/<name>/<rule>.test.ts` using the `vmRuleName` id.
4. `bun run test` then `bun run check`.
