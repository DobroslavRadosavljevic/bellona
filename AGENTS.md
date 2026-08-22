# AGENTS.md

## Stack

- TypeScript 7 (strict, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`, `lib: ES2022`) on Bun; package manager is **Bun** (`bun.lock`), not npm/pnpm/yarn
- Oxlint JS plugins: `@oxlint/plugins` / `oxlint` 1.78, `createOnce` only — no ESLint `create` / `eslintCompatPlugin`
- Tests: Vitest 4 (`bun run test` / `bunx vitest`, **not** `bun test`)
- Build: tsdown 0.22 ESM + dts; format: Oxfmt; lint: Oxlint (`oxlint.config.ts` + `oxfmt.config.ts`)

## Commands

- Install: `bun install`
- Test all: `bun run test`
- Test file: `bunx vitest run tests/unit/plugins/js/max-classes.test.ts`
- Test name: `bunx vitest run path/to/file.test.ts -t "custom max"`
- Lint: `bun run lint` / `bun run lint:fix`
- Types: `bun run typecheck`
- Format: `bun run format` / `bun run format:check`
- Build / watch: `bun run build` / `bun run dev`
- Gate (local stand-in for CI): `bun run check`
- npm web login: `bun run login` (opens the npm login page; token goes to the user `~/.npmrc`)
- npm identity: `bun run whoami`
- Pack lint: `bun run pack:lint` (needs a current `dist/`)
- Publish dry-run: `bun run pack:dry` (runs `prepublishOnly` → `check`)
- Publish: `bun publish` from this machine after `bun run login`. No GitHub Actions.

## Communication (ASD-STE100)

Hard rule for all agent text to humans. Also covers names in the codebase. Do not skip for tone, polish, or expertise.

**ASD-STE100 Simplified Technical English** is a controlled writing standard. Aerospace and defense groups made it. It helps people write clear technical text.

**Key rules:**

- **Use approved words only.** Treat simple common English as the word list. Each word has one meaning.
- **Use one word for one idea.** Do not use two words for the same thing.
- **Write short sentences.** Use 20 words or less for instructions. Use 25 words or less for other sentences.
- **Use active voice.** Write "Turn the switch", not "The switch must be turned".
- **Write short paragraphs.** Keep one topic in each paragraph.

**Also:**

- Prefer common verbs: `use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`.
- Keep exact API names, errors, paths, and code. Define a hard term in one short sentence the first time. Then reuse that term.
- Match the user’s word for a thing. Do not rename it in prose.
- Names must read like English intent. No riddles, meme names, or opaque abbreviation piles.
- Lead with the outcome or the next action. Put raw dumps last.
- Do not send a reply until the prose passes these checks.

**Goal:** The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way.

## Layout

- One plugin per `src/plugins/<id>/`; default export is the Oxlint plugin object
- Shared factories: `src/lib/` (`defineBellonaPlugin`, `defineBellonaRule`, option readers)
- Per plugin: `index.ts`, local helpers (`options.ts`, `ast.ts`, `filename.ts`, `route.ts`, `shared/`), rules in `rules/`
- `src/index.ts` is a specifier catalog only — **not** a plugin; consumers import `bellona/js` (see `package.json` `exports`)
- Tests: `tests/unit/plugins/<id>/` (`fixtures.ts`, `harness.ts`, `*.test.ts`); shared: `tests/unit/lib/` (`getRule` wraps `create` for `RuleTester` only)
- Generated: `dist/` — do not edit by hand
- Public consumer skill: `skills/bellona/` (skills.sh). `.agents/skills/bellona` is a symlink to that tree
- Oxfmt/Oxlint already ignore `.agents/`, `.claude/`, `agent/`, `skills/` — do not format or lint those trees

## Project rules

- New framework/domain = **new** `src/plugins/<id>/` + `package.json` `exports` + `tsdown.config.ts` `entry` + `tests/unit/plugins/<id>/`. TypeScript evidence rules stay on `bellona/js`.
- `meta.name` must equal the last export segment (`js`, `react`, `base-ui`, `zod`, `tanstack-router`, `elysia`, `effect`) so ids are `<name>/bn-<slug>`
- Register with `bnRuleName('slug')` (`bn-max-classes`, never bare `max-classes`)
- Rules ship **off**. Never add a recommended config that enables them
- Prefer `schema` + `defaultOptions`; read options with typed field helpers from visitors/`before`, not from the `createOnce` closure
- Copy `src/plugins/js/rules/max-classes.ts` + `tests/unit/plugins/js/` for a new rule. JS evidence AST lives in `src/plugins/js/shared/`
- Type rules with `defineBellonaRule` so `createOnce` stays; do not annotate as `Rule` (widens)
- Do not use `as` / `any` to hide option or AST types — narrow in `src/lib/`
- `node.parent` is `Node | null`. Coerce with `?? undefined` before `ESTree.Node | undefined` walks
- `lib` is ES2022: no `Array#toSorted`. Copy then insert, or accept a local mutate of a fresh array
- Use `.ts` import specifiers (`allowImportingTsExtensions`); tsdown strips them in `dist/`
- Do not publish ESLint compatibility. Do not treat Oxlint as a formatter

## Testing

- For every rule change, add `valid`/`invalid` `RuleTester` cases, including `allow` / option variants and a no-import skip
- Iterate with focused Vitest on that plugin; finish with `bun run check` before a PR

## Boundaries

- Always: run focused Vitest on the plugin you touched, then `bun run check` before a PR
- Ask first: new runtime dependencies, new plugin subpaths, oxlint major bumps, publishing, push
- Never: commit secrets (including npm tokens); edit `dist/`; use `bun test`; format/lint skill trees; add GitHub CI for publish
- Publish is local only: `bun run login`, bump `package.json` + `CHANGELOG.md`, `bun run check`, `bun run pack:dry`, then `bun publish`. Tokens stay in the user `~/.npmrc`

## Docs index

| Topic                      | Document                                                       |
| -------------------------- | -------------------------------------------------------------- |
| Human setup / consumer API | `README.md`                                                    |
| Changelog / versions       | `CHANGELOG.md`                                                 |
| Consumer agent skill       | `skills/bellona/`                                               |
| Plugin entries / publish   | `package.json`, `tsdown.config.ts`, `.npmrc`                   |
| Lint / format              | `oxlint.config.ts`, `oxfmt.config.ts`                          |
| Oxlint JS plugins          | https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html |
