import { noV3ServiceTagsName } from '../../../../src/plugins/effect/rules/no-v3-service-tags.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noV3ServiceTagsName, {
  valid: [
    { ...ts, code: withEffect('const Db = Context.Service<{ q(): string }>("app/db/Db")') },
    {
      ...ts,
      code: withEffect(
        'class Db extends Context.Service<Db, { q(): string }>()("app/db/Db") { static readonly layer = Layer.empty }',
      ),
    },
    { ...ts, code: 'Context.Tag("Db")' },
    { ...ts, code: NO_EFFECT },
    validWith(withEffect('Context.Tag("Db")'), {
      filename: 'src/app.ts',
      options: [{ allow: ['app.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: withEffect('const Db = Context.Tag("Db")'),
      errors: [error('tag')],
    },
    {
      ...ts,
      code: withEffect('const Db = Context.GenericTag<{ q(): string }>("Db")'),
      errors: [error('tag')],
    },
    {
      ...ts,
      code: withEffect('class Db extends Context.Tag("Db")<Db, { q(): string }>() {}'),
      errors: [error('tag')],
    },
    {
      ...ts,
      code: withEffect('class Db extends Effect.Tag("Db")<Db, { q(): string }>() {}'),
      errors: [error('tag')],
    },
    {
      ...ts,
      code: withEffect('class Db extends Effect.Service<Db>()("Db", { succeed: {} }) {}'),
      errors: [error('tag')],
    },
    {
      ...ts,
      code: `import { Tag } from 'effect/Context';\nconst Db = Tag("Db")`,
      errors: [error('tag')],
    },
    {
      ...ts,
      code: `import { Context as C } from 'effect';\nC.GenericTag("Db")`,
      errors: [error('tag')],
    },
    {
      ...ts,
      code: `import { Service } from 'effect/Effect';\nclass Db extends Service()("Db", { succeed: {} }) {}`,
      errors: [error('tag')],
    },
  ],
});
