# Setup

## Install

```sh
bun add -D vamana oxlint
```

npm / pnpm / yarn also work. Peer: `oxlint` `^1.78.0`. Engines: Node `^20.19.0 || >=22.12.0`.

Pin `oxlint` (JS plugins are alpha, outside Oxlint semver). Keep `vamana` and `oxlint` on the same 1.78 minor when possible (`@oxlint/plugins` is vamana’s runtime dependency).

## Wire `oxlint.config.ts`

```ts
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

Omit any subpath you do not want loaded.

JSON is valid too:

```jsonc
{
  "jsPlugins": ["vamana/js"],
  "rules": {
    "js/vm-max-classes": ["error", { "max": 5 }]
  }
}
```

## Specifier catalog

The root package export is **not** a plugin. Optional:

```ts
import { plugins } from 'vamana';

defineConfig({
  jsPlugins: [plugins.js, plugins.effect],
});
```

| Key | Specifier |
| --- | --- |
| `plugins.js` | `vamana/js` |
| `plugins.react` | `vamana/react` |
| `plugins.baseUi` | `vamana/base-ui` |
| `plugins.zod` | `vamana/zod` |
| `plugins.tanstackRouter` | `vamana/tanstack-router` |
| `plugins.elysia` | `vamana/elysia` |
| `plugins.effect` | `vamana/effect` |

## Rule ids

Format: `<plugin-name>/vm-<slug>`.

- Plugin name = `meta.name` = last export segment (`js`, `base-ui`, `tanstack-router`, …).
- Rule slug always starts with `vm-` (avoids clashing with other plugins).
- Severity: `'off' | 'warn' | 'error'` or `['error', { ...options }]`.

Wrong: `vamana/js/vm-max-classes`, `js/max-classes`, `vm-max-classes`.
Right: `js/vm-max-classes`.

## Options

One object at `rules` value index 1 (Oxlint options array index `0`):

```ts
'js/vm-no-runtime-typeof': ['error', { allowInTypeGuards: true }],
'js/vm-no-unknown-parameters': ['error', { allow: ['cause', 'input'] }],
'react/vm-no-native-html': [
  'error',
  {
    tags: ['button', 'input'],
    replacements: { button: { component: 'Button', from: '@/ui/button' } },
  },
],
'elysia/vm-require-route-schema': ['error', { methods: ['post', 'put'] }],
'effect/vm-no-run-promise-in-modules': [
  'error',
  { entry: ['/main.ts', '/runtime.ts'], allow: ['/scripts/'] },
],
```

Unknown option keys are ignored at runtime (schema `additionalProperties: false` is for docs/tooling). Invalid types fall back to defaults.

## Shared `allow`

Most non-`js` rules accept `{ allow: string[] }` (default `[]`).

A file is skipped when:

- The slash-normalized path **contains** an allow entry, or
- An allow entry contains `.` and equals the **basename** (example: `generated.ts`).

Typical: `{ allow: ['/generated/', 'legacy-route.ts'] }`.

## Test-file skip

Plugins that skip tests treat a file as a test when the path matches:

- a segment `__tests__`, `test`, `tests`, or `fixtures`, or
- a suffix `.test` / `.spec` / `.stories` plus a JS/TS(X) extension.

`js` evidence rules do **not** skip tests (they apply everywhere, including `vi.mock`).

## Scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

Most vamana rules have **no** autofix. `--fix` will not rewrite `Effect.fn` or rename Zod schemas.

## Inline disable

Prefer Oxlint directives:

```ts
// oxlint-disable-next-line js/vm-max-classes
```

```ts
/* oxlint-disable js/vm-no-runtime-typeof -- boundary decoder lives in parse.ts */
```

`eslint-disable` still works while migrating if `respectEslintDisableDirectives` is true (Oxlint default).

## Enable-many paste

Rules stay off until listed. This is a consumer choice, not a package preset. Copy only the plugins you loaded:

```ts
rules: {
  // js
  'js/vm-max-classes': 'error',
  'js/vm-no-chained-type-assertions': 'error',
  'js/vm-no-conditional-empty-object-spread': 'error',
  'js/vm-no-known-value-widening': 'error',
  'js/vm-no-module-mocking': 'error',
  'js/vm-no-object-parameters': 'error',
  'js/vm-no-reflect-apply': 'error',
  'js/vm-no-reflect-get': 'error',
  'js/vm-no-runtime-typeof': 'error',
  'js/vm-no-shape-in-symbol-names': 'error',
  'js/vm-no-unknown-parameters': 'error',
  'js/vm-no-unknown-returns': 'error',
  'js/vm-no-unknown-type-aliases': 'error',
  'js/vm-no-unsafe-dictionary-type': 'error',
  'js/vm-no-widen-then-assert': 'error',
  'js/vm-require-safety-comment-for-type-assertion': 'error',
}
```

Per-plugin full lists: `references/*-rules.md`.

## Nested configs

Oxlint nested configs do **not** auto-merge. Use `extends` (TS: imported objects; JSON: relative paths). `-c/--config` disables nested lookup.

Setting `plugins: [...]` on Oxlint **replaces** the default plugin set. That is the built-in Oxlint plugin list (`eslint`, `typescript`, …), not `jsPlugins`. Re-list built-ins when you still want them. `jsPlugins` is a separate field.

## Do not

- Do not add vamana to ESLint `plugins`.
- Do not expect `eslint-plugin-vamana`.
- Do not enable rules via a shareable `extends: 'vamana/recommended'` — it does not exist.
- Do not import rule implementations from `vamana/js` in app code; only Oxlint loads them.
