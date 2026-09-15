import { noV3ImportsName } from '../../../../src/plugins/effect/rules/no-v3-imports.ts';
import { error, validWith } from '../../lib/cases.ts';
import { NO_EFFECT, ts } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

function moved(source: string, replacement: string) {
  return { messageId: 'moved' as const, data: { source, replacement } };
}

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
    {
      ...ts,
      code: "import { TestClock } from 'effect/testing/TestClock';",
    },
    {
      ...ts,
      code: "import { Arbitrary } from 'effect/unstable/arbitrary';",
    },
    {
      ...ts,
      code: "import { SchemaBinary } from 'effect/unstable/encoding/SchemaBinary';",
    },
    {
      ...ts,
      code: "import { SchemaError, isSchemaError } from 'effect/Schema';",
    },
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
      errors: [moved('effect/FastCheck', 'fast-check')],
    },
    {
      ...ts,
      code: "import { ParseResult } from 'effect/ParseResult';",
      errors: [moved('effect/ParseResult', 'effect/SchemaIssue')],
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
    {
      ...ts,
      code: "import { SchemaError } from 'effect/SchemaError';",
      errors: [moved('effect/SchemaError', 'effect/Schema')],
    },
    {
      ...ts,
      code: "import { FastCheck } from 'effect/testing/FastCheck';",
      errors: [moved('effect/testing/FastCheck', 'fast-check')],
    },
    {
      ...ts,
      code: "import { Msgpack } from 'effect/unstable/encoding/Msgpack';",
      errors: [moved('effect/unstable/encoding/Msgpack', 'effect/unstable/encoding/SchemaBinary')],
    },
    {
      ...ts,
      code: "import { Args } from '@effect/cli/Args';",
      errors: [moved('@effect/cli/Args', 'effect/unstable/cli/Argument')],
    },
    {
      ...ts,
      code: "import { Options } from '@effect/cli/Options';",
      errors: [moved('@effect/cli/Options', 'effect/unstable/cli/Flag')],
    },
    {
      ...ts,
      code: `import { Either } from 'effect/Either';
import { SchemaError } from 'effect/SchemaError';
import { FastCheck } from 'effect/testing/FastCheck';
import { Msgpack } from 'effect/unstable/encoding/Msgpack';
`,
      errors: [
        moved('effect/Either', 'effect/Result'),
        moved('effect/SchemaError', 'effect/Schema'),
        moved('effect/testing/FastCheck', 'fast-check'),
        moved('effect/unstable/encoding/Msgpack', 'effect/unstable/encoding/SchemaBinary'),
      ],
    },
  ],
});
