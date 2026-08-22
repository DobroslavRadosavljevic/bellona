import { requireServiceIdPathName } from '../../../../src/plugins/effect/rules/require-service-id-path.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(requireServiceIdPathName, {
  valid: [
    { ...ts, code: withEffect('const Db = Context.Service<{ q(): string }>("myapp/db/Database")') },
    { ...ts, code: withEffect('const Db = Context.Service<{ q(): string }>("pkg/Name")') },
    { ...ts, code: withEffect('const Db = Context.Service(id)') },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("myapp/db/Database") { static readonly layer = Layer.empty }',
      ),
    },
    { ...testTs, code: withEffect('const Db = Context.Service("Database")') },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('const Db = Context.Service("Database")'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('const Db = Context.Service<{ q(): string }>("Database")'),
      errors: [error('path')],
    },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("Database") { static readonly layer = Layer.empty }',
      ),
      errors: [error('path')],
    },
    {
      ...ts,
      code: withEffect('const Db = Context.Service("myapp/")'),
      errors: [error('path')],
    },
    {
      ...ts,
      code: `import { Service } from 'effect/Context';\nconst Db = Service("Db")`,
      errors: [error('path')],
    },
  ],
});
