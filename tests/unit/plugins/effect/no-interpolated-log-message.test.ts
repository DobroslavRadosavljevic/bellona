import { noInterpolatedLogMessageName } from '../../../../src/plugins/effect/rules/no-interpolated-log-message.ts';
import { validWith } from '../../lib/cases.ts';
import { NO_EFFECT, testTs, ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function interpolated(api: string) {
  return { messageId: 'interpolated' as const, data: { api } };
}

const TEMPLATE = withEffect('Effect.logError(`Billing job ${name} failed`, cause)');

runEffectRule(noInterpolatedLogMessageName, {
  valid: [
    { ...ts, code: withEffect('Effect.logError("Billing job failed", { name }, cause)') },
    { ...ts, code: withEffect('Effect.logInfo(`Server started`)') },
    // A value after the message is data.
    { ...ts, code: withEffect('Effect.logDebug("Cache hit", `${key}`)') },
    { ...ts, code: withEffect('Effect.log(message)') },
    { ...ts, code: withEffect('console.log(`Port ${port}`)') },
    { ...ts, code: withEffect('Logger.log(`Port ${port}`)') },
    { ...ts, code: 'Effect.logError(`Billing job ${name} failed`)' },
    { ...ts, code: NO_EFFECT },
    { ...testTs, code: TEMPLATE },
    validWith(TEMPLATE, { filename: 'src/app.ts', options: [{ allow: ['app.ts'] }] }),
  ],
  invalid: [
    { ...ts, code: TEMPLATE, errors: [interpolated('Effect.logError')] },
    {
      ...ts,
      code: withEffect('Effect.logInfo(`Listening on port ${String(port)}`)'),
      errors: [interpolated('Effect.logInfo')],
    },
    {
      ...ts,
      code: withEffect('Effect.logWarning("Redis " + name + " cleanup failed", cause)'),
      errors: [interpolated('Effect.logWarning')],
    },
    {
      ...ts,
      code: withEffect('Effect.logWithLevel("Info")(`Loaded ${count} rows`)'),
      errors: [interpolated('Effect.logWithLevel')],
    },
    {
      ...ts,
      code: `import { log, logFatal } from 'effect/Effect';\nlog(\`a \${b}\`);\nlogFatal(\`c \${d}\`);`,
      errors: [interpolated('Effect.log'), interpolated('Effect.logFatal')],
    },
  ],
});
