import { describe, expect, it } from 'vitest';

import js from '../../../../src/plugins/js/index.ts';

describe('js plugin', () => {
  it('registers every TypeScript evidence rule under a js- id', () => {
    expect(Object.keys(js.rules)).toEqual([
      'max-classes',
      'no-chained-type-assertions',
      'no-conditional-empty-object-spread',
      'no-inline-import-type',
      'no-known-value-widening',
      'no-module-mocking',
      'no-object-parameters',
      'no-reflect-apply',
      'no-reflect-get',
      'no-runtime-typeof',
      'no-shape-in-symbol-names',
      'no-unknown-parameters',
      'no-unknown-returns',
      'no-unknown-type-aliases',
      'no-unsafe-dictionary-type',
      'no-useless-reexport',
      'no-widen-then-assert',
      'require-safety-comment-for-type-assertion',
    ]);
  });
});
