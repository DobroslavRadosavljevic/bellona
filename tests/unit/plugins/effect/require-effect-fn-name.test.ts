import { requireEffectFnNameName } from '../../../../src/plugins/effect/rules/require-effect-fn-name.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(requireEffectFnNameName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'export const loadUser = Effect.fn("loadUser")(function*(id: string) { return id })',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'const query = Effect.fn("Database.query")(function*(sql: string) { return sql })',
      ),
    },
    { ...ts, code: withEffect('Effect.fnUntraced(function*() { return 1 })') },
    { ...ts, code: NO_EFFECT },
    {
      ...ts,
      code: withEffect(
        'class Database { static query = Effect.fn("Database.query")(function*(sql: string) { return sql }) }',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'export const loadUser = Effect.fn("loadUser", { attributes: { k: 1 } })(function*() { return 1 })',
      ),
    },
    validWith(withEffect('const loadUser = Effect.fn(function*() { return 1 })'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('const loadUser = Effect.fn(function*() { return 1 })'),
      errors: [error('missing')],
    },
    {
      ...ts,
      code: withEffect('Effect.fn(function*() { return 1 })'),
      errors: [error('missing')],
    },
    {
      ...ts,
      code: withEffect('const loadUser = Effect.fn("fetchUser")(function*() { return 1 })'),
      errors: [error('mismatch')],
    },
    {
      ...ts,
      code: withEffect('const query = Effect.fn("get")(function*() { return 1 })'),
      errors: [error('mismatch')],
    },
    {
      ...ts,
      code: `import { fn } from 'effect/Effect';\nconst loadUser = fn(function*() { return 1 })`,
      errors: [error('missing')],
    },
    {
      ...ts,
      code: `import { Effect as E } from 'effect';\nconst loadUser = E.fn(function*() { return 1 })`,
      errors: [error('missing')],
    },
    {
      ...ts,
      code: withEffect(
        'const loadUser = Effect.fn("fetchUser" as const)(function*() { return 1 })',
      ),
      errors: [error('mismatch')],
    },
    {
      ...ts,
      code: withEffect(
        'class Database { static query = Effect.fn("get")(function*(sql: string) { return sql }) }',
      ),
      errors: [error('mismatch')],
    },
  ],
});
