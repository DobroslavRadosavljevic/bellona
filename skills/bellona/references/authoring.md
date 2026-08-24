# Authoring a bellona plugin or rule

Use this only when changing the **bellona package**. For consumer config, use [setup.md](setup.md).

## New domain plugin

A new framework/domain is a new `src/plugins/<id>/` plus:

1. `package.json` `exports["./<id>"]`
2. `tsdown.config.ts` `entry`
3. `src/index.ts` catalog key
4. `tests/unit/plugins/<id>/` (`harness.ts`, `fixtures.ts`, `*.test.ts`)
5. README + this skill’s catalog

TypeScript evidence rules stay on `bellona/js`. Do not start a second JS plugin.

Every plugin uses a unique `meta.name` (`bl-<id>`). Rule keys are the slug only. Oxlint ids are `bl-<id>/<slug>`.

Rules ship **off**. Never add a recommended config that enables them.

Ask before: new runtime dependencies, new plugin subpaths, oxlint major bumps, publishing, push.

## New rule (copy this path)

1. Copy `src/plugins/js/rules/max-classes.ts`.
2. Export `bnRuleName('your-slug')` as `yourRuleName`. Register the plugin with `defineBellonaPlugin('bl-<id>', …)`.
3. Use `defineBellonaRule` + `createOnce`. Type with `defineBellonaRule`; do not annotate as `Rule` (widens).
4. Prefer `schema` + `defaultOptions`. Read options with `objectOptionAt` / field helpers from visitors or `before`, not from the `createOnce` closure.
5. Register in `src/plugins/<id>/index.ts`.
6. Add `tests/unit/plugins/<id>/<rule>.test.ts` with `valid` / `invalid` `RuleTester` cases:
   - default behavior
   - option variants (`allow`, `max`, …)
   - no-import skip (domain plugins)
   - test-file skip when the production rule skips tests
7. Run focused Vitest, then `bun run check`.

```sh
bunx vitest run tests/unit/plugins/js/max-classes.test.ts
bunx vitest run tests/unit/plugins/effect/prefer-effect-fn.test.ts -t "pipe"
bun run check
```

Do **not** use `bun test`.

## Test harness

`tests/unit/lib/rule-tester.ts` wraps `createOnce` so `oxlint/plugins-dev` `RuleTester` can call `create`. Plugin harnesses call `runRule(plugin, name, tests, lang)`.

```ts
import { preferEffectFnName } from '../../../../src/plugins/effect/rules/prefer-effect-fn.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferEffectFnName, {
  valid: [/* ... */],
  invalid: [/* ... */],
});
```

Helpers: `validWith`, `invalidWith`, `error` in `tests/unit/lib/cases.ts`.

## AST / options rules

- `node.parent` is `Node | null` — use `?? undefined`.
- No `as` / `any` to hide option or AST types — narrow in `src/lib/`.
- No `Array#toSorted` (ES2022 lib).
- Use `.ts` import specifiers; tsdown strips them in `dist/`.
- Do not format or lint `.agents/`, `.claude/`, or `agent/` trees (already ignored).
- Do not edit `dist/` by hand.
- Do not publish ESLint compatibility.

## Domain skip helpers

Reuse the plugin’s `shouldSkip*` instead of copying path regexes:

| Plugin | Typical skip |
| --- | --- |
| react | `shouldSkipJsxFile` / `shouldSkipReactFile` |
| zod | `shouldSkipZodFile` |
| tanstack-router | `shouldSkipRouterFile` |
| elysia | `shouldSkipElysiaFile` and path variants |
| effect | `shouldSkipEffectFile` / `shouldSkipEffectStyleFile` / `shouldSkipNonTestEffectFile` / `shouldSkipRunPromiseFile` |

`matchesAllow` + `isTestFile` live in each plugin’s `filename.ts` (duplicated on purpose; keep plugins independent).

## Effect rules

Use `collectEffectBindings` + `isModuleCall` / `isModuleMember`. Do not match the identifier `Effect` as a string only — files may import `import { fn as effectFn } from 'effect/Effect'`.

v3 specifier maps belong in `src/plugins/effect/v3-imports.ts`.

## Self-lint

This repo loads **source** `bellona/js` in `oxlint.config.ts` (`jsPlugins: ['./src/plugins/js/index.ts']`) and turns **all** js rules on for the package itself. Consumer apps should not copy that “enable every js rule” loop unless they want it.
