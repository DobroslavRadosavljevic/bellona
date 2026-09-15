/** v3 specifier → v4 specifier (or module hint). */
const EXACT_REPLACEMENTS = new Map<string, string>([
  ['effect/Either', 'effect/Result'],
  ['effect/FiberRef', 'effect/References'],
  ['effect/JSONSchema', 'effect/JsonSchema'],
  ['effect/TestClock', 'effect/testing/TestClock'],
  ['effect/FastCheck', 'fast-check'],
  ['effect/testing/FastCheck', 'fast-check'],
  ['effect/ParseResult', 'effect/SchemaIssue'],
  ['effect/SchemaError', 'effect/Schema'],
  ['effect/TDeferred', 'effect/TxDeferred'],
  ['effect/TMap', 'effect/TxHashMap'],
  ['effect/TSet', 'effect/TxHashSet'],
  ['effect/TPriorityQueue', 'effect/TxPriorityQueue'],
  ['effect/TPubSub', 'effect/TxPubSub'],
  ['effect/TQueue', 'effect/TxQueue'],
  ['effect/TReentrantLock', 'effect/TxReentrantLock'],
  ['effect/TRef', 'effect/TxRef'],
  ['effect/TSemaphore', 'effect/TxSemaphore'],
  ['effect/TSubscriptionRef', 'effect/TxSubscriptionRef'],
  ['@effect/platform/FileSystem', 'effect/FileSystem'],
  ['@effect/platform/Path', 'effect/Path'],
  ['@effect/platform/Error', 'effect/PlatformError'],
  ['@effect/platform/Terminal', 'effect/Terminal'],
  ['@effect/platform/ChannelSchema', 'effect/ChannelSchema'],
  ['@effect/platform/HttpClient', 'effect/unstable/http'],
  ['@effect/platform/HttpServer', 'effect/unstable/http'],
  ['@effect/platform/HttpRouter', 'effect/unstable/http'],
  ['@effect/platform/HttpApi', 'effect/unstable/httpapi'],
  ['@effect/platform/HttpApiBuilder', 'effect/unstable/httpapi'],
  ['@effect/platform/KeyValueStore', 'effect/unstable/persistence'],
  ['@effect/sql/SqlClient', 'effect/unstable/sql'],
  ['@effect/sql/SqlError', 'effect/unstable/sql'],
  ['@effect/sql/Migrator', 'effect/unstable/sql'],
  ['@effect/sql/Model', 'effect/unstable/schema'],
  ['@effect/sql/Statement', 'effect/unstable/sql'],
  ['@effect/rpc/Rpc', 'effect/unstable/rpc'],
  ['@effect/rpc/RpcServer', 'effect/unstable/rpc'],
  ['@effect/rpc/RpcClient', 'effect/unstable/rpc'],
  ['@effect/cli/Command', 'effect/unstable/cli'],
  ['@effect/cli/Args', 'effect/unstable/cli/Argument'],
  ['@effect/cli/Options', 'effect/unstable/cli/Flag'],
  ['@effect/cluster/Entity', 'effect/unstable/cluster'],
  ['@effect/workflow/Workflow', 'effect/unstable/workflow'],
  ['@effect/ai/LanguageModel', 'effect/unstable/ai'],
  ['@effect/ai/Tool', 'effect/unstable/ai'],
  ['@effect/experimental/Sse', 'effect/unstable/encoding'],
  ['@effect/experimental/DevTools', 'effect/unstable/devtools'],
  ['effect/unstable/encoding/Msgpack', 'effect/unstable/encoding/SchemaBinary'],
  ['effect/Mailbox', 'effect/Queue'],
  ['@effect/opentelemetry/Otlp', 'effect/unstable/observability'],
  ['@effect/opentelemetry/OtlpLogger', 'effect/unstable/observability'],
  ['@effect/opentelemetry/OtlpMetrics', 'effect/unstable/observability'],
  ['@effect/opentelemetry/OtlpResource', 'effect/unstable/observability'],
  ['@effect/opentelemetry/OtlpSerialization', 'effect/unstable/observability'],
  ['@effect/opentelemetry/OtlpTracer', 'effect/unstable/observability'],
]);

const PREFIX_REPLACEMENTS: readonly { prefix: string; replacement: string }[] = [
  { prefix: '@effect/platform/', replacement: 'effect or effect/unstable/http' },
  { prefix: '@effect/sql/', replacement: 'effect/unstable/sql' },
  { prefix: '@effect/cli/', replacement: 'effect/unstable/cli' },
  { prefix: '@effect/rpc/', replacement: 'effect/unstable/rpc' },
  { prefix: '@effect/cluster/', replacement: 'effect/unstable/cluster' },
  { prefix: '@effect/experimental/', replacement: 'effect/unstable/*' },
  { prefix: '@effect/workflow/', replacement: 'effect/unstable/workflow' },
  { prefix: '@effect/ai/', replacement: 'effect/unstable/ai' },
];

/** True when the specifier is a current v4 driver / platform package. */
export function isCurrentEffectPackage(source: string): boolean {
  return (
    source === 'effect' ||
    source.startsWith('effect/') ||
    source === '@effect/vitest' ||
    source.startsWith('@effect/vitest/') ||
    source.startsWith('@effect/platform-') ||
    source.startsWith('@effect/sql-') ||
    source.startsWith('@effect/ai-') ||
    source.startsWith('@effect/atom-') ||
    source === '@effect/opentelemetry'
  );
}

/** v4 import path to use instead of a removed v3 specifier, if any. */
export function v3ImportReplacement(source: string): string | undefined {
  const exact = EXACT_REPLACEMENTS.get(source);
  if (exact !== undefined) {
    return exact;
  }
  for (const { prefix, replacement } of PREFIX_REPLACEMENTS) {
    if (source.startsWith(prefix)) {
      return replacement;
    }
  }
  return undefined;
}
