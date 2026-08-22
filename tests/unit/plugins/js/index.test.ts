import { describe, expect, it } from 'vitest';

import js from '../../../../src/plugins/js/index.ts';

describe('js plugin', () => {
  it('registers every TypeScript evidence rule under a bn- id', () => {
    expect(Object.keys(js.rules)).toEqual([
      'bn-max-classes',
      'bn-no-chained-type-assertions',
      'bn-no-conditional-empty-object-spread',
      'bn-no-known-value-widening',
      'bn-no-module-mocking',
      'bn-no-object-parameters',
      'bn-no-reflect-apply',
      'bn-no-reflect-get',
      'bn-no-runtime-typeof',
      'bn-no-shape-in-symbol-names',
      'bn-no-unknown-parameters',
      'bn-no-unknown-returns',
      'bn-no-unknown-type-aliases',
      'bn-no-unsafe-dictionary-type',
      'bn-no-widen-then-assert',
      'bn-require-safety-comment-for-type-assertion',
    ]);
  });
});
