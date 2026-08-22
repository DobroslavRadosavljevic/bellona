import { describe, expect, it } from 'vitest';

import { classDeclarations, classExpressions } from './fixtures.ts';

describe('classDeclarations', () => {
  it('joins class declaration snippets', () => {
    expect(classDeclarations(2)).toBe('class A {} class B {}');
  });
});

describe('classExpressions', () => {
  it('does not emit declarations', () => {
    expect(classExpressions(2)).toBe('const c0 = class {}; const c1 = class {};');
  });
});
