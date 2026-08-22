import { requireServiceStaticLayerName } from '../../../../src/plugins/effect/rules/require-service-static-layer.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(requireServiceStaticLayerName, {
  valid: [
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db") { static readonly layer = Layer.empty }',
      ),
    },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db", { make: Effect.succeed({ q: () => "1" }) }) {}',
      ),
    },
    { ...ts, code: withEffect('const Db = Context.Service<{ q(): string }>("myapp/db/Db")') },
    {
      ...testTs,
      code: withEffect('class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db") {}'),
    },
    { ...ts, code: NO_EFFECT },
    validWith(
      withEffect('class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db") {}'),
      { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] },
    ),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db") {}'),
      errors: [error('layer')],
    },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db") { static Default = Layer.empty }',
      ),
      errors: [error('defaultMember'), error('layer')],
    },
    {
      ...ts,
      code: withEffect(
        'const Db = class extends Context.Service<never, { q(): string }>()("myapp/db/Db") {}',
      ),
      errors: [error('layer')],
    },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Db", { make: Effect.succeed({ q: () => "1" }) }) { static Default = Layer.empty }',
      ),
      errors: [error('defaultMember')],
    },
  ],
});
