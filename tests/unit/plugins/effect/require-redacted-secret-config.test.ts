import { requireRedactedSecretConfigName } from '../../../../src/plugins/effect/rules/require-redacted-secret-config.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const IMPORT = "import { Config, Effect, Schema } from 'effect';\n";

function code(body: string): string {
  return `${IMPORT}${body}`;
}

function secret(api: string, key: string) {
  return { messageId: 'secret' as const, data: { api, key } };
}

const PLAIN_KEY = code('const apiKey = Config.String("OPENAI_API_KEY");');

runEffectRule(requireRedactedSecretConfigName, {
  valid: [
    { ...ts, code: code('const apiKey = Config.Redacted("OPENAI_API_KEY");') },
    { ...ts, code: code('const port = Config.Port("PORT");') },
    { ...ts, code: code('const url = Config.String("DATABASE_URL");') },
    { ...ts, code: code('const host = Config.NonEmptyString("REDIS_HOST");') },
    // A redacted schema keeps the value hidden.
    {
      ...ts,
      code: code('const token = Config.schema(Schema.Redacted(Schema.String), "GITHUB_TOKEN");'),
    },
    // No key: the name comes from `Config.nested`.
    { ...ts, code: code('const value = Config.String();') },
    { ...ts, code: code('const value = Config.String(name);') },
    { ...ts, code: 'const apiKey = Config.String("OPENAI_API_KEY");' },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: PLAIN_KEY },
    validWith(PLAIN_KEY, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
    // Option: a custom pattern replaces the default.
    validWith(PLAIN_KEY, { ...ts, options: [{ pattern: 'SECRET' }] }),
  ],
  invalid: [
    { ...ts, code: PLAIN_KEY, errors: [secret('Config.String', 'OPENAI_API_KEY')] },
    {
      ...ts,
      code: code('const password = Config.NonEmptyString(`DB_PASSWORD`);'),
      errors: [secret('Config.NonEmptyString', 'DB_PASSWORD')],
    },
    {
      ...ts,
      code: code('const secret = Config.schema(Schema.String, "webhook_secret");'),
      errors: [secret('Config.schema', 'webhook_secret')],
    },
    {
      ...ts,
      code: code('const token = Config.schema(Schema.NonEmptyString, ["polar", "ACCESS_TOKEN"]);'),
      errors: [secret('Config.schema', 'ACCESS_TOKEN')],
    },
    {
      ...ts,
      code: `import * as Config from 'effect/Config';\nconst key = Config.String("PRIVATE_PEM");`,
      errors: [secret('Config.String', 'PRIVATE_PEM')],
    },
    {
      ...ts,
      code: code('const salt = Config.String("HASH_SALT");'),
      options: [{ pattern: 'salt' }],
      errors: [secret('Config.String', 'HASH_SALT')],
    },
  ],
});
