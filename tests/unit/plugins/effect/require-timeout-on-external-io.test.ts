import { requireTimeoutOnExternalIoName } from '../../../../src/plugins/effect/rules/require-timeout-on-external-io.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const service = {
  filename: 'src/users/users.service.ts',
  languageOptions: ts.languageOptions,
};

const serviceTest = {
  filename: 'src/users/users.service.test.ts',
  languageOptions: ts.languageOptions,
};

const IMPORT =
  "import { Effect } from 'effect';\nimport { HttpClient } from 'effect/unstable/http';\n";

function code(body: string): string {
  return `${IMPORT}${body}`;
}

function timeout(api: string) {
  return { messageId: 'timeout' as const, data: { api } };
}

const NO_TIMEOUT = code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tryPromise({ try: (signal) => sdk.users.get(id, { signal }), catch: toError });
});
`);

runEffectRule(requireTimeoutOnExternalIoName, {
  valid: [
    // A timeout in the same pipe chain.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tryPromise(() => sdk.get(id)).pipe(Effect.mapError(toError), Effect.timeout("5 seconds"));
});
`),
    },
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.timeoutOrElse(Effect.tryPromise(() => sdk.get(id)), { duration: "5 seconds", orElse: fail });
});
`),
    },
    // A timeout in the extra arguments of Effect.fn.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tryPromise(() => sdk.get(id));
}, Effect.timeout("5 seconds"));
`),
    },
    // A caller in the same file adds the timeout.
    {
      ...service,
      code: code(`
export const layer = Layer.effect(Weather, Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.withScope);
  const request = Effect.fn("Weather.request")(function* (url: string) {
    return yield* client.execute(get(url));
  });
  return Weather.of({
    run: Effect.fn("Weather.run")(function* () {
      return yield* request(url).pipe(Effect.timeoutOrElse({ duration: 1000, orElse: fail }), Effect.scoped);
    }),
  });
}));
`),
    },
    // A helper in the same file adds the timeout.
    {
      ...service,
      code: code(`
const finish = (effect) => effect.pipe(Effect.timeout("1 minute"), Effect.scoped);
const response = Effect.fn("Http.response")(function* (url: string) {
  return yield* HttpClient.get(url);
});
const json = Effect.fn("Http.json")(function* (url: string) {
  return yield* finish(response(url));
});
const other = Effect.fn("Http.other")(function* () {
  return yield* finish(Effect.tryPromise(() => sdk.ping()));
});
`),
    },
    // Option: a shared helper from another module adds the timeout.
    validWith(
      code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tryPromise(() => sdk.get(id)).pipe(withRequestTimeout("users.get"));
});
`),
      { ...service, options: [{ helpers: ['withRequestTimeout'] }] },
    ),
    // The Promise function sets its own timeout.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (url: string) {
  return yield* Effect.tryPromise((signal) => fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }));
});
`),
    },
    {
      ...service,
      code: code(`
const run = Effect.fn("Runner.run")(function* (args: string[]) {
  return yield* Effect.tryPromise(async (signal) => {
    const child = Bun.spawn(args, { signal, timeout: 30000 });
    return await child.exited;
  });
});
`),
    },
    // Local file work does not wait for another system.
    {
      ...service,
      code: code(`
const read = Effect.fn("Spec.read")(function* (file: string) {
  const text = yield* Effect.tryPromise({ try: () => readFile(file, "utf8"), catch: toError });
  yield* Effect.tryPromise(() => fs.promises.rm(file));
  return yield* Effect.tryPromise(() => Promise.all(files.map((entry) => Bun.write(entry.path, entry.text))));
});
`),
    },
    // Option: a project API that does local work.
    validWith(NO_TIMEOUT.replace('sdk.users.get(id, { signal })', 'renderEmail(id)'), {
      ...service,
      options: [{ localApis: ['renderEmail'] }],
    }),
    // The Promise function makes no call. It only awaits a promise that already exists.
    {
      ...service,
      code: code(`
const finish = Effect.fn("Model.finish")(function* (result: StreamResult) {
  yield* Stream.runDrain(result.stream);
  const finishReason = yield* Effect.tryPromise(() => result.finishReason);
  const usage = yield* Effect.tryPromise({ try: () => result.usage, catch: toError });
  const pending = yield* Effect.tryPromise(() => existing);
  const awaited = yield* Effect.tryPromise(async () => await existing);
  const block = yield* Effect.tryPromise(async () => {
    return await result.totalUsage;
  });
  return [finishReason, usage, pending, awaited, block];
});
`),
    },
    // Not inside an Effect.fn body.
    {
      ...service,
      code: code('const call = (run) => Effect.tryPromise({ try: run, catch: toError });'),
    },
    {
      ...service,
      code: code(
        'const load = Effect.fn("Users.load")(function* () { yield* Effect.acquireRelease(open, (h) => Effect.tryPromise(() => h.close())) });',
      ),
    },
    // Not a `.service.ts` file.
    { ...ts, code: NO_TIMEOUT },
    {
      ...service,
      code: 'const load = Effect.fn("x")(function* () { return yield* Effect.tryPromise(() => sdk.get()) });',
    },
    { ...service, code: NO_EFFECT },
    { ...serviceTest, code: NO_TIMEOUT },
    validWith(NO_TIMEOUT, { ...service, options: [{ allow: ['users.service.ts'] }] }),
  ],
  invalid: [
    { ...service, code: NO_TIMEOUT, errors: [timeout('Effect.tryPromise')] },
    {
      ...service,
      code: code(`
const load = Effect.fnUntraced(function* (url: string) {
  const client = yield* HttpClient.HttpClient;
  const a = yield* client.execute(get(url)).pipe(Effect.mapError(toError));
  const b = yield* HttpClient.post(url);
  return [a, b];
});
`),
      errors: [timeout('HttpClient.execute'), timeout('HttpClient.post')],
    },
    // A timeout on a different chain does not count.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  yield* Effect.sleep(10).pipe(Effect.timeout("1 second"));
  return yield* Effect.tryPromise(() => sdk.get(id)).pipe(Effect.retry(policy));
});
`),
      errors: [timeout('Effect.tryPromise')],
    },
    // Option: a custom list replaces the default local APIs.
    {
      ...service,
      code: code(`
const read = Effect.fn("Spec.read")(function* (file: string) {
  return yield* Effect.tryPromise(() => readFile(file, "utf8"));
});
`),
      options: [{ localApis: ['Bun.write'] }],
      errors: [timeout('Effect.tryPromise')],
    },
    // `client.rm` is not the file system `rm`.
    {
      ...service,
      code: code(`
const remove = Effect.fn("Store.remove")(function* (key: string) {
  return yield* Effect.tryPromise(() => client.rm(key));
});
`),
      errors: [timeout('Effect.tryPromise')],
    },
    // A call or a `new` in the Promise function starts new work.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (url: string) {
  const a = yield* Effect.tryPromise(() => fetch(url));
  const b = yield* Effect.tryPromise(() => client.get());
  const c = yield* Effect.tryPromise(() => new Promise((resolve) => socket.once("open", resolve)));
  const d = yield* Effect.tryPromise(async () => await existing.then(parse));
  const e = yield* Effect.tryPromise(() => sql\`select 1\`);
  const f = yield* Effect.tryPromise(load);
  return [a, b, c, d, e, f];
});
`),
      errors: [
        timeout('Effect.tryPromise'),
        timeout('Effect.tryPromise'),
        timeout('Effect.tryPromise'),
        timeout('Effect.tryPromise'),
        timeout('Effect.tryPromise'),
        timeout('Effect.tryPromise'),
      ],
    },
    // A different helper does not count.
    {
      ...service,
      code: code(`
const load = Effect.fn("Users.load")(function* (id: string) {
  return yield* Effect.tryPromise(() => sdk.get(id)).pipe(withRetry("users.get"));
});
`),
      options: [{ helpers: ['withRequestTimeout'] }],
      errors: [timeout('Effect.tryPromise')],
    },
  ],
});
