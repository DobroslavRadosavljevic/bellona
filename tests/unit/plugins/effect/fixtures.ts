export const ts = {
  filename: 'src/app.ts',
  languageOptions: { parserOptions: { lang: 'ts' as const } },
};

export const testTs = {
  filename: 'src/app.test.ts',
  languageOptions: ts.languageOptions,
};

export const EFFECT_IMPORT =
  "import { Clock, Context, Data, DateTime, Effect, Layer, Predicate, Schema, Scope, Stream } from 'effect';\n";

export const EFFECT_NS_IMPORT = "import * as Effect from 'effect/Effect';\n";

export const SCHEMA_NS_IMPORT = "import * as Schema from 'effect/Schema';\n";

export const VITEST_EFFECT =
  "import { it } from '@effect/vitest';\nimport { Effect } from 'effect';\n";

export const VITEST_PLAIN =
  "import { it, test } from 'vitest';\nimport { Effect } from 'effect';\n";

export const NO_EFFECT = 'const value = 1;\n';

export function withEffect(code: string, importLine: string = EFFECT_IMPORT): string {
  return `${importLine}${code}`;
}

export function withVitestEffect(code: string): string {
  return `${VITEST_EFFECT}${code}`;
}

export function withVitestPlain(code: string): string {
  return `${VITEST_PLAIN}${code}`;
}
