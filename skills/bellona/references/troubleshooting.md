# Troubleshooting

## Plugin does not load

- Specifier must be a **subpath**: `bellona/js`, not `bellona`.
- `oxlint` must be installed (peer). JS plugins need a Node-capable Oxlint, not a standalone binary without JS plugin support.
- Pin `oxlint` to ^1.78. Alpha JS plugins break across Oxlint minors.
- Config must use `jsPlugins`, not `plugins`. `plugins` is the built-in Oxlint plugin list (`eslint`, `typescript`, `unicorn`, …).
- After adding a plugin, restart the Oxc editor extension so it reloads JS plugins.

## Rule never reports

1. Confirm the id is `bl-<plugin>/<slug>` and severity is not `'off'`.
2. Confirm that plugin is in `jsPlugins`.
3. Import gate: Zod/Router/Elysia/Effect skip files with no matching import. Add a real import or pick another file.
4. Test skip: most domain rules ignore `*.test.ts`, `*.spec.ts`, `*.stories.*`, and paths under `test` / `tests` / `__tests__` / `fixtures`.
5. `allow`: a substring such as `/generated/` skips the whole file.
6. Path gate (Elysia): `bl-elysia/one-route-method-per-file` only runs on `/routes/` leaf files, not `routes/index.ts`.
7. Effect style rules (`shouldSkipEffectStyleFile`) skip tests; `bl-effect/prefer-vitest` runs **only** on tests.
8. `before()` returned `false` because an option list was empty (Base UI: both component lists empty).

## Wrong plugin prefix

| You wrote | Actual |
| --- | --- |
| `js/bn-max-classes` | `bl-js/max-classes` |
| `baseui/bn-…` | `bl-base-ui/…` |
| `tanstack/bn-…` | `bl-tanstack-router/…` |
| `effect/prefer-effect-fn` | `bl-effect/prefer-fn` |

## File looks clean but the pattern exists

- JS evidence rules are **syntactic**. They do not use `--type-aware`. Aliases defined in another file are often invisible.
- Effect binding tracking follows imports in **this** file. Re-exported helpers from a local wrapper may not look like `Effect.fn`.
- Base UI matching is by **JSX name** (`Dialog.Trigger` or `DialogTrigger`), not by the import specifier.

## `createOnce` options leak (package authors)

If every file sees the first file’s options, you read `context.options` in the `createOnce` closure. Move the read into `before()` or the visitor.

## Tests fail in this repo

- Use `bunx vitest` / `bun run test`, not `bun test`.
- `RuleTester` needs `getRule` so `create` exists. Do not call `rule.createOnce` from tests directly.
- Pass `lang: 'tsx'` (via the plugin harness) for JSX rules.

## Oxlint vs formatter

Bellona does not format. Use Oxfmt (this repo) or the consumer’s formatter. Do not enable Oxlint style rules as a Prettier replacement.

## Disable noise without turning the rule off

```ts
// oxlint-disable-next-line bl-effect/no-date-now -- clock is injected above
```

Prefer a small `allow` path list for generated code over repo-wide `'off'`.
