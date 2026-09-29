import { noModuleLevelMutableStateName } from '../../../../src/plugins/effect/rules/no-module-level-mutable-state.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function mutable(name: string) {
  return { messageId: 'mutable' as const, data: { name } };
}

const REASSIGNED = withEffect(
  'let count = 0;\nexport const bump = Effect.sync(() => { count += 1 });',
);

runEffectRule(noModuleLevelMutableStateName, {
  valid: [
    { ...ts, code: withEffect('const limit = 10;') },
    // A `let` that is never written again is a `const` in practice.
    { ...ts, code: withEffect('let limit = 10;\nexport const read = () => limit;') },
    // Local state inside a function is fine.
    { ...ts, code: withEffect('function run() { let count = 0; count += 1; return count }') },
    {
      ...ts,
      code: withEffect('export const make = Effect.gen(function* () { let n = 0; n++; return n })'),
    },
    { ...ts, code: withEffect('declare let injected: string;') },
    { ...ts, code: 'let count = 0;\ncount += 1;' },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: REASSIGNED },
    validWith(REASSIGNED, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: REASSIGNED, errors: [mutable('count')] },
    {
      ...ts,
      code: withEffect('var cache;\nexport function load() { cache = read() }'),
      errors: [mutable('cache')],
    },
    {
      ...ts,
      code: withEffect(
        'export let client: Client | undefined;\nexport const connect = Effect.sync(() => { client ??= open() });',
      ),
      errors: [mutable('client')],
    },
    {
      ...ts,
      code: withEffect('let a = 0, b = 0;\nexport const tick = () => { a++; b = a };'),
      errors: [mutable('a'), mutable('b')],
    },
    {
      ...ts,
      code: withEffect('let { x } = init();\nexport const set = (v: number) => { x = v };'),
      errors: [mutable('x')],
    },
  ],
});
