# Setup

## Install

```sh
bun add -D bellona oxlint
```

npm / pnpm / yarn also work. Peer: `oxlint` `^1.78.0`. Engines: Node `^20.19.0 || >=22.12.0`.

Pin `oxlint` (JS plugins are alpha, outside Oxlint semver). Keep `bellona` and `oxlint` on the same 1.78 minor when possible (`@oxlint/plugins` is bellona’s runtime dependency).

## Wire `oxlint.config.ts`

```ts
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

Omit any subpath you do not want loaded.

JSON is valid too:

```jsonc
{
  "jsPlugins": ["bellona/js"],
  "rules": {
    "js/bn-max-classes": ["error", { "max": 5 }]
  }
}
```

## Specifier catalog

The root package export is **not** a plugin. Optional:

```ts
import { plugins } from 'bellona';

defineConfig({
  jsPlugins: [plugins.js, plugins.effect],
});
```

| Key | Specifier |
| --- | --- |
| `plugins.js` | `bellona/js` |
| `plugins.react` | `bellona/react` |
| `plugins.baseUi` | `bellona/base-ui` |
| `plugins.zod` | `bellona/zod` |
| `plugins.tanstackRouter` | `bellona/tanstack-router` |
| `plugins.elysia` | `bellona/elysia` |
| `plugins.effect` | `bellona/effect` |

## Rule ids

Format: `<plugin-name>/bn-<slug>`.

- Plugin name = `meta.name` = last export segment (`js`, `base-ui`, `tanstack-router`, …).
- Rule slug always starts with `bn-` (avoids clashing with other plugins).
- Severity: `'off' | 'warn' | 'error'` or `['error', { ...options }]`.

Wrong: `bellona/js/bn-max-classes`, `js/max-classes`, `bn-max-classes`.
Right: `js/bn-max-classes`.

## Options

One object at `rules` value index 1 (Oxlint options array index `0`):

```ts
'js/bn-no-runtime-typeof': ['error', { allowInTypeGuards: true }],
'js/bn-no-unknown-parameters': ['error', { allow: ['cause', 'input'] }],
'react/bn-no-native-html': [
  'error',
  {
    tags: ['button', 'input'],
    replacements: { button: { component: 'Button', from: '@/ui/button' } },
  },
],
'elysia/bn-require-route-schema': ['error', { methods: ['post', 'put'] }],
'effect/bn-no-run-promise-in-modules': [
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

Most bellona rules have **no** autofix. `--fix` will not rewrite `Effect.fn` or rename Zod schemas.

## Inline disable

Prefer Oxlint directives:

```ts
// oxlint-disable-next-line js/bn-max-classes
```

```ts
/* oxlint-disable js/bn-no-runtime-typeof -- boundary decoder lives in parse.ts */
```

`eslint-disable` still works while migrating if `respectEslintDisableDirectives` is true (Oxlint default).

## Enable-many paste

Rules stay off until listed. This is a consumer choice, not a package preset. Copy only the plugins you loaded:

```ts
rules: {
  // js
  'js/bn-max-classes': 'error',
  'js/bn-no-chained-type-assertions': 'error',
  'js/bn-no-conditional-empty-object-spread': 'error',
  'js/bn-no-known-value-widening': 'error',
  'js/bn-no-module-mocking': 'error',
  'js/bn-no-object-parameters': 'error',
  'js/bn-no-reflect-apply': 'error',
  'js/bn-no-reflect-get': 'error',
  'js/bn-no-runtime-typeof': 'error',
  'js/bn-no-shape-in-symbol-names': 'error',
  'js/bn-no-unknown-parameters': 'error',
  'js/bn-no-unknown-returns': 'error',
  'js/bn-no-unknown-type-aliases': 'error',
  'js/bn-no-unsafe-dictionary-type': 'error',
  'js/bn-no-widen-then-assert': 'error',
  'js/bn-require-safety-comment-for-type-assertion': 'error',
}
```

Per-plugin full lists: `references/*-rules.md`.

## Nested configs

Oxlint nested configs do **not** auto-merge. Use `extends` (TS: imported objects; JSON: relative paths). `-c/--config` disables nested lookup.

Setting `plugins: [...]` on Oxlint **replaces** the default plugin set. That is the built-in Oxlint plugin list (`eslint`, `typescript`, …), not `jsPlugins`. Re-list built-ins when you still want them. `jsPlugins` is a separate field.

## Do not

- Do not add bellona to ESLint `plugins`.
- Do not expect `eslint-plugin-bellona`.
- Do not enable rules via a shareable `extends: 'bellona/recommended'` — it does not exist.
- Do not import rule implementations from `bellona/js` in app code; only Oxlint loads them.
