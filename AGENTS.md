# AGENTS.md

## Communication

Always write to the user in **ASD-STE100 Simplified Technical English**. This applies to chat, summaries, and explanations. It does not apply to code, identifiers, commit messages, or quoted errors.

ASD-STE100 is a controlled writing standard. The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way.

- Use approved words only. Each word has one meaning.
- Use one word for one idea. Do not use two words for the same thing.
- Write short sentences. Use 20 words or less for instructions.
- Use active voice. Write "Turn the switch", not "The switch must be turned".
- Write short paragraphs. Keep one topic in each paragraph.

Keep technical names (APIs, files, flags) when they are required. Define a new term in one short sentence on first use.

## Stack

- TypeScript (strict) on Bun 1.3; package manager is **Bun** (`bun.lock`), not npm/pnpm/yarn
- Oxlint JS plugins (`@oxlint/plugins` 1.78, `createOnce` only — no ESLint `create` / `eslintCompatPlugin`)
- Tests: Vitest 4 (`bun run test` / `bunx vitest`, **not** `bun test`)
- Build: tsdown 0.22 ESM + dts; format: Oxfmt; lint: Oxlint

## Commands

- Install: `bun install`
- Test all: `bun run test`
- Test file: `bunx vitest run tests/unit/plugins/js/max-classes.test.ts`
- Test name: `bunx vitest run path/to/file.test.ts -t "custom max"`
- Lint: `bun run lint` / `bun run lint:fix`
- Types: `bun run typecheck`
- Format: `bun run format` / `bun run format:check`
- Build: `bun run build`
- Gate (matches CI): `bun run check`

## Layout

- One plugin per subpath under `src/plugins/<id>/`; default export is the Oxlint plugin object
- Shared: `src/lib/` (plugin/rule factories, option readers)
- Per plugin: `src/plugins/<id>/index.ts`, plugin-local helpers (`options.ts`, `ast.ts`, `filename.ts`, `shared/`), and rules in `src/plugins/<id>/rules/`
- `src/index.ts` is a specifier catalog only — **not** a plugin; consumers use `vamana/js` etc.
- Tests: `tests/unit/plugins/<id>/` (`fixtures.ts`, `harness.ts`, `*.test.ts`); shared test helpers: `tests/unit/lib/`
- Generated: `dist/` — do not edit
- Ignore agent skill trees (`.agents/`, `.claude/`, `agent/`) in Oxfmt/Oxlint configs

## Project rules

- New framework/domain coverage = **new plugin folder + package `exports` entry + tsdown `entry`**, not a dump onto an existing plugin. TypeScript evidence rules live on `vamana/js`.
- Plugin `meta.name` must match the last export segment (`js`, `react`, `base-ui`, `zod`, `tanstack-router`, `elysia`) so rule ids are `<name>/vm-<slug>`
- Register rules with `vmRuleName('slug')` (`vm-max-classes`, never a bare `max-classes`)
- Rules ship **off**. Never add a recommended config that enables them
- Prefer `schema` + `defaultOptions`; read options with typed field helpers from visitors/`before`, not from the `createOnce` closure
- Copy `src/plugins/js/rules/max-classes.ts` + `tests/unit/plugins/js/` for new rules. Evidence-rule shared AST lives in `src/plugins/js/shared/`.
- Do not annotate rules as `Rule` (widens); use `defineVamanaRule` so `createOnce` is preserved
- Do not use `as` / `any` to paper over option or AST types — narrow with helpers in `src/lib/`
- Use `.ts` import specifiers (`allowImportingTsExtensions`); tsdown strips them in `dist/`
- `getRule` is test-only (adds `create` for `RuleTester`). Do not publish ESLint compatibility
- Do not treat Oxlint as a formatter

## Testing

- Add `valid`/`invalid` `RuleTester` cases (including option variants) for every rule change
- Finish with `bun run check` before a PR

## Boundaries

- Always: run focused Vitest on the plugin you touched, then `bun run check` before PR
- Ask first: new runtime dependencies, new plugin subpaths, oxlint major bumps, publishing
- Never: commit secrets; edit `dist/`; use `bun test`; format/lint the skill trees

## Docs index

| Topic                      | Document                                                       |
| -------------------------- | -------------------------------------------------------------- |
| Human setup / consumer API | `README.md`                                                    |
| CI                         | `.github/workflows/ci.yml`                                     |
| Oxlint JS plugins          | https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html |
