# Setup

## Install

```sh
bun add -D bellona oxlint
```

npm / pnpm / yarn also work. Peer: `oxlint` `^1.78.0`. Engines: Node `^20.19.0 || >=22.12.0`.

Pin `oxlint` (JS plugins are alpha, outside Oxlint semver). Keep `bellona` and `oxlint` on the same 1.78 minor when possible (`@oxlint/plugins` is bellona’s runtime dependency).

This skill matches **bellona 0.4.4**. Install that version (or later) so new rules and four-part reports exist.

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

Omit any subpath you do not want loaded.

JSON is valid too:

```jsonc
{
  "jsPlugins": ["bellona/js"],
  "rules": {
    "bl-js/max-classes": ["error", { "max": 5 }]
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
| `plugins.tailwind` | `bellona/tailwind` |

## Rule ids

Format: `bl-<plugin>/<slug>`.

- Plugin `meta.name` is unique (`bl-js`, `bl-react`, `bl-base-ui`, …).
- The rule key is the slug only (`max-classes`, `require-native-button-with-render`).
- Severity: `'off' | 'warn' | 'error'` or `['error', { ...options }]`.

Wrong: `bellona/js-max-classes`, `js/max-classes`, `bn-max-classes`.
Right: `bl-js/max-classes`.

## Diagnostics

Each report has four lines:

| Line | Use |
| --- | --- |
| **Problem** | What the rule caught (includes filled `{{placeholders}}`) |
| **Why** | Why that code is wrong in this stack |
| **Fix** | The change to make (copy the example, then adapt names) |
| **Avoid** | Patches that fail (disable comments, dummy uses, a second banned API) |

Apply **Fix**. Obey **Avoid**. Re-run `oxlint` on that file. Open the plugin catalog only if the report is incomplete.

Do not add `oxlint-disable` unless the file is generated or listed in `allow`.

## Options

One object at `rules` value index 1 (Oxlint options array index `0`):

```ts
'bl-js/no-runtime-typeof': ['error', { allowInTypeGuards: true }],
'bl-js/no-unknown-parameters': ['error', { allow: ['cause', 'input'] }],
'bl-js/no-useless-reexport': ['error', { allow: ['src/index.ts'], allowRenames: true }],
'bl-react/no-native-html': [
  'error',
  {
    tags: ['button', 'input'],
    replacements: { button: { component: 'Button', from: '@/ui/button' } },
  },
],
'bl-elysia/require-route-schema': ['error', { methods: ['post', 'put'] }],
'bl-effect/no-run-promise-in-modules': [
  'error',
  { entry: ['/main.ts', '/runtime.ts'], allow: ['/scripts/'] },
],
'bl-tailwind/no-classname-constants': [
  'error',
  { minUtilities: 2, allowedCallees: ['tv', 'createTV'] },
],
```

Unknown option keys are ignored at runtime (schema `additionalProperties: false` is for docs/tooling). Invalid types fall back to defaults.

## Shared `allow`

Most non-`js` rules accept `{ allow: string[] }` (default `[]`). `bl-js/no-useless-reexport` also accepts path `allow`.

A file is skipped when:

- The slash-normalized path **contains** an allow entry, or
- An allow entry contains `.` and equals the **basename** (example: `generated.ts`).

Typical: `{ allow: ['/generated/', 'legacy-route.ts'] }`.

## Test-file skip

Plugins that skip tests treat a file as a test when the path matches:

- a segment `__tests__`, `test`, `tests`, or `fixtures`, or
- a suffix `.test` / `.spec` / `.stories` plus a JS/TS(X) extension.

`js` evidence rules do **not** skip tests (they apply everywhere, including `vi.mock` and `bl-js/no-useless-reexport`).

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
// oxlint-disable-next-line bl-js/max-classes
```

```ts
/* oxlint-disable bl-js/no-runtime-typeof -- boundary decoder lives in parse.ts */
```

`eslint-disable` still works while migrating if `respectEslintDisableDirectives` is true (Oxlint default).

## Enable-many paste

Rules stay off until listed. This is a consumer choice, not a package preset. Copy only the plugins you loaded:

```ts
rules: {
  // js
  'bl-js/max-classes': 'error',
  'bl-js/no-chained-type-assertions': 'error',
  'bl-js/no-conditional-empty-object-spread': 'error',
  'bl-js/no-inline-import-type': 'error',
  'bl-js/no-known-value-widening': 'error',
  'bl-js/no-module-mocking': 'error',
  'bl-js/no-object-parameters': 'error',
  'bl-js/no-reflect-apply': 'error',
  'bl-js/no-reflect-get': 'error',
  'bl-js/no-runtime-typeof': 'error',
  'bl-js/no-shape-in-symbol-names': 'error',
  'bl-js/no-unknown-parameters': 'error',
  'bl-js/no-unknown-returns': 'error',
  'bl-js/no-unknown-type-aliases': 'error',
  'bl-js/no-unsafe-dictionary-type': 'error',
  'bl-js/no-useless-reexport': 'error',
  'bl-js/no-widen-then-assert': 'error',
  'bl-js/require-safety-comment-for-type-assertion': 'error',
  // react
  'bl-react/component-file-name-match': 'error',
  'bl-react/component-props-type': 'error',
  'bl-react/hook-file-name-match': 'error',
  'bl-react/no-impl-component-suffix': 'error',
  'bl-react/no-jsx-iife-in-components': 'error',
  'bl-react/no-jsx-local-constants-in-components': 'error',
  'bl-react/no-jsx-module-constants': 'error',
  'bl-react/no-jsx-variable-reassignment-in-components': 'error',
  'bl-react/no-multi-component-files': 'error',
  'bl-react/no-multi-hook-files': 'error',
  'bl-react/no-native-html': 'error',
  'bl-react/no-namespace': 'error',
  'bl-react/no-render-helper-functions-in-components': 'error',
  'bl-react/require-bare-hook-call': 'error',
  // base-ui
  'bl-base-ui/require-native-button-with-render': 'error',
  // zod
  'bl-zod/modern-format-validators': 'error',
  'bl-zod/schema-naming': 'error',
  // tanstack-router
  'bl-tanstack-router/create-route-property-order': 'error',
  'bl-tanstack-router/no-control-flow-outside-edge': 'error',
  'bl-tanstack-router/no-dynamic-to': 'error',
  'bl-tanstack-router/no-get-route-api': 'error',
  'bl-tanstack-router/no-hooks-in-route-lifecycle': 'error',
  'bl-tanstack-router/no-imperative-location-navigation': 'error',
  'bl-tanstack-router/no-loader-data-in-not-found': 'error',
  'bl-tanstack-router/no-not-found-in-component': 'error',
  'bl-tanstack-router/no-not-found-route': 'error',
  'bl-tanstack-router/no-relative-to-without-from': 'error',
  'bl-tanstack-router/no-href': 'error',
  'bl-tanstack-router/no-type-assertion': 'error',
  'bl-tanstack-router/no-search-in-loader': 'error',
  'bl-tanstack-router/require-params-with-path-tokens': 'error',
  'bl-tanstack-router/require-hook-from': 'error',
  'bl-tanstack-router/require-inline-route-options': 'error',
  'bl-tanstack-router/require-throw-not-found': 'error',
  'bl-tanstack-router/require-throw-redirect': 'error',
  'bl-tanstack-router/require-validate-search-when-used': 'error',
  // elysia
  'bl-elysia/no-context-param': 'error',
  'bl-elysia/no-controller-context-class': 'error',
  'bl-elysia/no-cookie-undefined-check': 'error',
  'bl-elysia/no-functional-plugin-callback': 'error',
  'bl-elysia/no-route-factory': 'error',
  'bl-elysia/one-route-method-per-file': 'error',
  'bl-elysia/prefer-resolve-for-auth': 'error',
  'bl-elysia/prefer-status-helper': 'error',
  'bl-elysia/prefer-throw-status': 'error',
  'bl-elysia/require-error-body-literal': 'error',
  'bl-elysia/require-plugin-name': 'error',
  'bl-elysia/require-response-schema': 'error',
  'bl-elysia/require-route-export-name': 'error',
  'bl-elysia/require-route-schema': 'error',
  'bl-elysia/routes-index-mount-only': 'error',
  // effect
  'bl-effect/no-v3-apis': 'error',
  'bl-effect/no-v3-imports': 'error',
  'bl-effect/no-v3-service-tags': 'error',
  'bl-effect/prefer-fn': 'error',
  'bl-effect/require-fn-name': 'error',
  'bl-effect/no-pipe-on-fn': 'error',
  'bl-effect/no-try-catch-in-gen': 'error',
  'bl-effect/no-throw-in-gen': 'error',
  'bl-effect/require-return-yield-on-fail': 'error',
  'bl-effect/schema-union-array': 'error',
  'bl-effect/prefer-date-from-string': 'error',
  'bl-effect/prefer-decode-unknown': 'error',
  'bl-effect/no-it-scoped': 'error',
  'bl-effect/no-run-promise-in-modules': 'error',
  'bl-effect/require-service-id-path': 'error',
  'bl-effect/require-service-static-layer': 'error',
  'bl-effect/prefer-service-of': 'error',
  'bl-effect/no-date-now': 'error',
  'bl-effect/prefer-clock-sleep': 'error',
  'bl-effect/prefer-schema-tagged-error': 'error',
  'bl-effect/prefer-try-promise': 'error',
  'bl-effect/prefer-predicate': 'error',
  'bl-effect/no-yield-ref-handle': 'error',
  'bl-effect/prefer-vitest': 'error',
  'bl-effect/schema-no-legacy-filter': 'error',
  // tailwind
  'bl-tailwind/no-classname-constants': 'error',
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
