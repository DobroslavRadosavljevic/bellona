import { describe, expect, it } from 'vitest';

import js from '../../../../src/plugins/js/index.ts';

describe('js plugin', () => {
  it('registers every TypeScript evidence rule under a vm- id', () => {
    expect(Object.keys(js.rules)).toEqual([
      'vm-max-classes',
      'vm-no-chained-type-assertions',
      'vm-no-conditional-empty-object-spread',
      'vm-no-known-value-widening',
      'vm-no-module-mocking',
      'vm-no-object-parameters',
      'vm-no-reflect-apply',
      'vm-no-reflect-get',
      'vm-no-runtime-typeof',
      'vm-no-shape-in-symbol-names',
      'vm-no-unknown-parameters',
      'vm-no-unknown-returns',
      'vm-no-unknown-type-aliases',
      'vm-no-unsafe-dictionary-type',
      'vm-no-widen-then-assert',
      'vm-require-safety-comment-for-type-assertion',
    ]);
  });
});
