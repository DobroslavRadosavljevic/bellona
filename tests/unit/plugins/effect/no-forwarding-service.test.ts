import { noForwardingServiceName } from '../../../../src/plugins/effect/rules/no-forwarding-service.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function forwarding(name: string) {
  return { messageId: 'forwarding' as const, data: { name } };
}

function service(members: string): string {
  return withEffect(`
class Users extends Context.Service<Users, Shape>()("a/Users") {
  static readonly layer = Layer.effect(
    Users,
    Effect.gen(function* () {
      const repo = yield* UserRepo;
      return Users.of({
${members}
      });
    }),
  );
}
`);
}

const ALL_FORWARD = service(`
        find: (id) => repo.find(id),
        save: (id, user) => repo.save(id, user),
`);

runEffectRule(noForwardingServiceName, {
  valid: [
    // One member does real work.
    {
      ...ts,
      code: service(`
        find: (id) => repo.find(id),
        rename: Effect.fn("Users.rename")(function* (id, name) {
          const user = yield* repo.find(id);
          return yield* repo.save(id, { ...user, name });
        }),
`),
    },
    // Arguments change or move.
    { ...ts, code: service('find: (id) => repo.find(id, { cache: true }),') },
    { ...ts, code: service('save: (id, user) => repo.save(user, id),') },
    { ...ts, code: service('find: (id) => repo.find(id.trim()),') },
    // A call to an imported module is not a service call.
    { ...ts, code: service('wrap: (value) => Effect.succeed(value),') },
    { ...ts, code: service('') },
    { ...ts, code: service('find: (id) => this.find(id),') },
    // A plain class is not a service.
    {
      ...ts,
      code: withEffect(
        'class Users { static readonly layer = Layer.effect(Users, Effect.gen(function* () { const repo = yield* UserRepo; return Users.of({ find: (id) => repo.find(id) }) })) }',
      ),
    },
    {
      ...ts,
      code: `class Users extends Context.Service<Users, Shape>()("a/Users") { static readonly layer = Layer.succeed(Users, Users.of({ find: (id) => repo.find(id) })) }`,
    },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: ALL_FORWARD },
    validWith(ALL_FORWARD, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: ALL_FORWARD, errors: [forwarding('Users')] },
    {
      ...ts,
      code: service(`
        find: repo.find,
        list() { return repo.list() },
        remove: function (id) { return repo.remove(id) },
`),
      errors: [forwarding('Users')],
    },
    {
      ...ts,
      code: service(`
        find: Effect.fn("Users.find")(function* (id) {
          return yield* repo.find(id);
        }),
        count: Effect.fnUntraced(function* () {
          return yield* repo.count();
        }),
`),
      errors: [forwarding('Users')],
    },
    {
      ...ts,
      code: withEffect(`
class Users extends Context.Service<Users, Shape>()("a/Users") {
  static readonly layer = Layer.effect(this, Effect.gen(function* () {
    const repo = yield* UserRepo;
    return Users.of({ ...repo });
  }));
}
`),
      errors: [forwarding('Users')],
    },
  ],
});
