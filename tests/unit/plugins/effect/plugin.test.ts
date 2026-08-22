import { describe, expect, it } from 'vitest';

import {
  isServiceIdPath,
  isTestFile,
  matchesAllow,
  slash,
} from '../../../../src/plugins/effect/filename.ts';
import effect from '../../../../src/plugins/effect/index.ts';
import {
  isCurrentEffectPackage,
  v3ImportReplacement,
} from '../../../../src/plugins/effect/v3-imports.ts';

describe('effect plugin', () => {
  it('registers 25 rules under meta.name effect', () => {
    expect(effect.meta.name).toBe('effect');
    expect(Object.keys(effect.rules)).toHaveLength(25);
  });
});

describe('slash', () => {
  it('normalizes Windows separators', () => {
    expect(slash('src\\app.ts')).toBe('src/app.ts');
  });
});

describe('isTestFile', () => {
  it('matches test path segments and suffixes', () => {
    expect(isTestFile('src/app.test.ts')).toBe(true);
    expect(isTestFile('src/app.spec.tsx')).toBe(true);
    expect(isTestFile('src/app.stories.ts')).toBe(true);
    expect(isTestFile('tests/app.ts')).toBe(true);
    expect(isTestFile('src/__tests__/app.ts')).toBe(true);
    expect(isTestFile('src/fixtures/app.ts')).toBe(true);
    expect(isTestFile('src/app.ts')).toBe(false);
  });
});

describe('matchesAllow', () => {
  it('matches path fragments and basenames', () => {
    expect(matchesAllow('src/generated/app.ts', ['/generated/'])).toBe(true);
    expect(matchesAllow('src/app.ts', ['app.ts'])).toBe(true);
    expect(matchesAllow('src/app.ts', ['other.ts'])).toBe(false);
    expect(matchesAllow('src/app.ts', [])).toBe(false);
  });
});

describe('isServiceIdPath', () => {
  it('requires two or more non-empty segments', () => {
    expect(isServiceIdPath('myapp/db/Database')).toBe(true);
    expect(isServiceIdPath('pkg/Name')).toBe(true);
    expect(isServiceIdPath('Database')).toBe(false);
    expect(isServiceIdPath('myapp/')).toBe(false);
    expect(isServiceIdPath('/Database')).toBe(false);
    expect(isServiceIdPath('')).toBe(false);
  });
});

describe('v3ImportReplacement', () => {
  it('maps exact v3 specifiers', () => {
    expect(v3ImportReplacement('effect/Either')).toBe('effect/Result');
    expect(v3ImportReplacement('effect/FiberRef')).toBe('effect/References');
    expect(v3ImportReplacement('effect/JSONSchema')).toBe('effect/JsonSchema');
    expect(v3ImportReplacement('effect/TRef')).toBe('effect/TxRef');
    expect(v3ImportReplacement('effect/TestClock')).toBe('effect/testing/TestClock');
    expect(v3ImportReplacement('@effect/platform/HttpClient')).toBe('effect/unstable/http');
    expect(v3ImportReplacement('@effect/sql/SqlClient')).toBe('effect/unstable/sql');
    expect(v3ImportReplacement('effect/Mailbox')).toBe('effect/Queue');
  });

  it('maps v3 package prefixes', () => {
    expect(v3ImportReplacement('@effect/platform/Cookies')).toBe('effect or effect/unstable/http');
    expect(v3ImportReplacement('@effect/cli/Prompt')).toBe('effect/unstable/cli');
    expect(v3ImportReplacement('@effect/ai/Chat')).toBe('effect/unstable/ai');
    expect(v3ImportReplacement('@effect/opentelemetry/Otlp')).toBe('effect/unstable/observability');
  });

  it('does not map current v4 packages', () => {
    expect(v3ImportReplacement('effect')).toBeUndefined();
    expect(v3ImportReplacement('effect/Result')).toBeUndefined();
    expect(v3ImportReplacement('effect/unstable/http')).toBeUndefined();
    expect(isCurrentEffectPackage('@effect/platform-node')).toBe(true);
    expect(isCurrentEffectPackage('@effect/sql-pg')).toBe(true);
    expect(isCurrentEffectPackage('@effect/ai-openai')).toBe(true);
    expect(isCurrentEffectPackage('@effect/opentelemetry')).toBe(true);
    expect(v3ImportReplacement('@effect/opentelemetry')).toBeUndefined();
    expect(v3ImportReplacement('@effect/opentelemetry/NodeSdk')).toBeUndefined();
    expect(isCurrentEffectPackage('@effect/opentelemetry/Otlp')).toBe(false);
    expect(v3ImportReplacement('@effect/platform-node')).toBeUndefined();
    expect(v3ImportReplacement('@effect/sql-pg')).toBeUndefined();
  });
});
