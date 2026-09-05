# How bellona works

## Package shape

- **Runtime:** ESM (`"type": "module"`). The npm tarball is `dist/` plus `skills/bellona/`. npm also adds `README.md`, `LICENSE`, and `CHANGELOG.md`.
- **Build:** tsdown 0.22, one entry per plugin plus the catalog (`src/index.ts` → `bellona`).
- **Lint API:** `@oxlint/plugins` `CreateOnceRule`. No ESLint `create`. No `eslintCompatPlugin`.
- **Peer:** `oxlint` ^1.78. **Dependency:** `@oxlint/plugins` ^1.78.

`package.json` `exports`:

| Subpath | Source |
| --- | --- |
| `.` | `src/index.ts` — specifier catalog, not a plugin |
| `./js` | `src/plugins/js/index.ts` |
| `./react` | `src/plugins/react/index.ts` |
| `./base-ui` | `src/plugins/base-ui/index.ts` |
| `./zod` | `src/plugins/zod/index.ts` |
| `./tanstack-router` | `src/plugins/tanstack-router/index.ts` |
| `./elysia` | `src/plugins/elysia/index.ts` |
| `./effect` | `src/plugins/effect/index.ts` |
| `./tailwind` | `src/plugins/tailwind/index.ts` |

Each plugin default-export is `{ meta: { name: 'bl-<plugin>' }, rules }`. Rule keys are the slug only. Oxlint ids are `bl-<plugin>/<slug>`.

## Load path

1. Consumer lists `'bellona/effect'` in `jsPlugins`.
2. Oxlint resolves the package export relative to the config file.
3. The plugin object registers rule keys such as `prefer-fn`.
4. Consumer sets `'bl-effect/prefer-fn': 'error'`.
5. For each file, Oxlint calls the rule’s `createOnce` visitors (shared across files). `before()` may return `false` to skip the file.

## `createOnce` vs `create`

Published rules implement **only** `createOnce`. That callback runs **once per process**. Per-file state belongs in `before()` / visitors.

```ts
createOnce(context) {
  let bindings;
  return {
    before() {
      if (shouldSkipEffectFile(context)) return false;
      bindings = collectEffectBindings(context.sourceCode.ast);
    },
    CallExpression(node) { /* use bindings + context.options */ },
  };
}
```

**Wrong:** close over `context.options` in `createOnce` and reuse them for every file.

**Right:** call `objectOptionAt(context, 0)` from `before` or the visitor.

`RuleTester` in this repo still calls `create`. Tests wrap `createOnce` via `getRule` in `tests/unit/lib/rule-tester.ts`. Consumers never do that.

## Factories

| Helper | File | Role |
| --- | --- | --- |
| `defineBellonaPlugin('bl-js', rules)` | `src/lib/plugin.ts` | `{ meta: { name: 'bl-js' }, rules }` |
| `defineBellonaRule(rule)` | `src/lib/rule.ts` | preserves `createOnce` typing (do not annotate as `Rule`) |
| `bnRuleName('slug')` | `src/lib/rule.ts` | returns `slug` |
| `objectOptionAt` / `integerField` / `stringField` / `stringListField` / `booleanField` / `namedImportHintMap` | `src/lib/options.ts` | typed option readers |
| `agentDiagnostic` | `src/lib/lint-message.ts` | Problem / Why / Fix / Avoid lint text |

Do not use `as` / `any` to hide option or AST types. Narrow in `src/lib/`.

`node.parent` is `Node | null`. Coerce with `?? undefined` before walks that expect `ESTree.Node | undefined`.

`lib` is ES2022: no `Array#toSorted`. Copy then insert, or mutate a fresh array.

Source imports use `.ts` specifiers (`allowImportingTsExtensions`). tsdown strips them in `dist/`.

## Skip layers

Most domain rules stack these checks in `before()`:

1. **Import gate** — file must import the stack:
   - Zod: `zod` or `zod/…`
   - Router: `@tanstack/react-router` \| `solid-router` \| `react-start` \| `solid-start`
   - Elysia: `elysia` (see `programImportsElysia`)
   - Effect: `effect`, `effect/…`, or `@effect/…` (`programImportsEffect`)
   - React JSX rules: filename ends with `.tsx` / `.jsx` (some React rules also run on `.ts` hook files)
   - Base UI: **no** `@base-ui/react` import required (JSX name matching)
   - Tailwind: **no** import gate (class strings do not need a package import)
   - JS: **no** import gate
2. **Test skip** — see [setup.md](setup.md). Not used by most `js` rules. Effect: some rules skip tests; `bl-effect/prefer-vitest` runs **only** on tests.
3. **`allow`** — path substring / basename.
4. **Path gate** (Elysia / Effect entry):
   - Elysia routes leaf: `/routes/` and not `index.*`
   - Elysia routes index: `/routes/` + `index.*`
   - Elysia plugins: `/plugins/`
   - Elysia route factory: `/modules/` or `/routes/` (no elysia import required)
   - Elysia plugin name: skips `/main.ts` `/server.ts` `/index.ts` `/app.ts` plus `allow`
   - Effect runPromise: skips default entry basenames plus `allow`

If `before()` returns `false`, visitors do not run.

## Bindings (Effect)

`src/plugins/effect/bindings.ts` records how the file imported Effect:

- Namespace: `import * as Effect from 'effect/Effect'` or barrel `import { Effect } from 'effect'`
- Named: `import { fn } from 'effect/Effect'`
- Vitest: `it` / `test` from `@effect/vitest`

Rules then use `isModuleCall` / `isModuleMember` so `Effect.catchAll` and a renamed import both match.

## Type evidence (JS)

Several `js` rules walk TypeScript AST plus a file-local alias environment (`src/plugins/js/shared/`). They are syntactic evidence rules, not `oxlint-tsgolint` type-aware linting. They do not need `--type-aware`.

## Layout in this repo

```
src/lib/                 shared factories
src/plugins/<id>/
  index.ts               defineBellonaPlugin
  options.ts             allow / skip / option readers
  ast.ts, filename.ts    local helpers
  rules/<slug>.ts        one rule per file
tests/unit/plugins/<id>/
  harness.ts, fixtures.ts, *.test.ts
```

Generated: `dist/` — do not edit.

## Counts (current)

| Plugin | Rules |
| --- | --- |
| js | 18 |
| react | 12 |
| base-ui | 1 |
| zod | 2 |
| tanstack-router | 14 |
| elysia | 15 |
| effect | 25 |
| tailwind | 1 |
| **total** | **88** |
