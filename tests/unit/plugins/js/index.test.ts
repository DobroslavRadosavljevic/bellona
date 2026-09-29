import { describe, expect, it } from 'vitest';

import js from '../../../../src/plugins/js/index.ts';

describe('js plugin', () => {
  it('registers every TypeScript evidence rule under a js- id', () => {
    expect(Object.keys(js.rules)).toEqual([
      'no-chained-type-assertions',
      'no-generic-module-names',
      'no-inline-import-type',
      'no-known-value-widening',
      'no-module-mocking',
      'no-object-keys-assertion',
      'no-object-parameters',
      'no-runtime-typeof',
      'no-shape-in-symbol-names',
      'no-unknown-parameters',
      'no-unknown-returns',
      'no-unknown-type-aliases',
      'no-unsafe-dictionary-type',
      'no-untyped-json',
      'no-useless-reexport',
      'no-widen-then-assert',
      'require-file-layout',
      'require-own-key-lookup',
      'require-safety-comment-for-type-assertion',
    ]);
  });
});
