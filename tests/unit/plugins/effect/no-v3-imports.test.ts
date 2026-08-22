import { noV3ImportsName } from '../../../../src/plugins/effect/rules/no-v3-imports.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

runEffectRule(noV3ImportsName, {
  valid: [
    { ...ts, code: "import { Result } from 'effect/Result';" },
    { ...ts, code: "import { Effect } from 'effect';" },
    { ...ts, code: "import { HttpClient } from 'effect/unstable/http';" },
    { ...ts, code: "import { NodeHttpClient } from '@effect/platform-node';" },
    { ...ts, code: "import { PgClient } from '@effect/sql-pg';" },
    { ...ts, code: "import { OpenAiClient } from '@effect/ai-openai';" },
    { ...ts, code: "import { it } from '@effect/vitest';" },
    { ...ts, code: "import { FileSystem } from 'effect/FileSystem';" },
    { ...ts, code: NO_EFFECT },
    { ...ts, code: "import { NodeSdk } from '@effect/opentelemetry';" },
    { ...ts, code: "import { NodeSdk } from '@effect/opentelemetry/NodeSdk';" },
    validWith("import { Either } from 'effect/Either';", {
      filename: 'src/legacy.ts',
      options: [{ allow: ['legacy.ts'] }],
    }),
  ],
  invalid: [
    {
      ...ts,
      code: "import { Either } from 'effect/Either';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { FiberRef } from 'effect/FiberRef';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { JSONSchema } from 'effect/JSONSchema';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { TRef } from 'effect/TRef';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { TestClock } from 'effect/TestClock';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { HttpClient } from '@effect/platform/HttpClient';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { SqlClient } from '@effect/sql/SqlClient';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { Command } from '@effect/cli/Command';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { LanguageModel } from '@effect/ai/LanguageModel';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "export { Either } from 'effect/Either';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "export * from 'effect/Either';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import type { Either } from 'effect/Either';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { FastCheck } from 'effect/FastCheck';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { TQueue } from 'effect/TQueue';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { Otlp } from '@effect/opentelemetry/Otlp';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "const loaded = import('effect/Either');",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { Cookies } from '@effect/platform/Cookies';",
      errors: [error('moved')],
    },
    {
      ...ts,
      code: "import { Mailbox } from 'effect/Mailbox';",
      errors: [error('moved')],
    },
  ],
});
