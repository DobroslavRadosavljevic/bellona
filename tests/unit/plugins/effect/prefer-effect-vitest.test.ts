import { preferEffectVitestName } from '../../../../src/plugins/effect/rules/prefer-effect-vitest.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, withVitestEffect, withVitestPlain } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(preferEffectVitestName, {
  valid: [
    {
      ...testTs,
      code: withVitestEffect('it.effect("ok", () => Effect.gen(function*() { return 1 }))'),
    },
    { ...testTs, code: withVitestPlain('it("ok", () => { expect(1).toBe(1) })') },
    {
      ...testTs,
      code: withVitestPlain('it("ok", () => Effect.fn("load")(function*() { return 1 }))'),
    },
    { ...testTs, code: NO_EFFECT },
    {
      filename: 'src/app.ts',
      languageOptions: testTs.languageOptions,
      code: withVitestPlain('it("ok", () => Effect.gen(function*() { return 1 }))'),
    },
    validWith(withVitestPlain('it("ok", () => Effect.succeed(1))'), {
      filename: 'src/app.test.ts',
      options: [{ allow: ['app.test.ts'] }],
    }),
  ],
  invalid: [
    {
      ...testTs,
      code: withVitestPlain('it("ok", () => Effect.gen(function*() { return 1 }))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('it("ok", () => Effect.succeed(1))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('test("ok", () => Effect.fail("x"))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('it("ok", () => { return Effect.gen(function*() { return 1 }) })'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('it.only("ok", () => Effect.succeed(1))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('it.skip("ok", () => Effect.fail("x"))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('it("ok", () => Effect.succeed(1).pipe(Effect.map((n) => n)))'),
      errors: [error('itEffect')],
    },
    {
      ...testTs,
      code: withVitestPlain('test.only("ok", () => Effect.succeed(1))'),
      errors: [error('itEffect')],
    },
  ],
});
