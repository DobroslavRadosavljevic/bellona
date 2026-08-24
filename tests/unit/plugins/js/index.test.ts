import { describe, expect, it } from 'vitest';

import js from '../../../../src/plugins/js/index.ts';

describe('js plugin', () => {
  it('registers every TypeScript evidence rule under a js- id', () => {
    expect(Object.keys(js.rules)).toEqual([
      'js-max-classes',
      'js-no-chained-type-assertions',
      'js-no-conditional-empty-object-spread',
      'js-no-known-value-widening',
      'js-no-module-mocking',
      'js-no-object-parameters',
      'js-no-reflect-apply',
      'js-no-reflect-get',
      'js-no-runtime-typeof',
      'js-no-shape-in-symbol-names',
      'js-no-unknown-parameters',
      'js-no-unknown-returns',
      'js-no-unknown-type-aliases',
      'js-no-unsafe-dictionary-type',
      'js-no-widen-then-assert',
      'js-require-safety-comment-for-type-assertion',
    ]);
  });
});
