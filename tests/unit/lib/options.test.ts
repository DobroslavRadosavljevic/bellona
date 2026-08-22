import { describe, expect, it } from 'vitest';

import {
  booleanField,
  integerField,
  stringField,
  stringListField,
} from '../../../src/lib/options.ts';

describe('integerField', () => {
  it('uses fallback when missing or not an integer', () => {
    expect(integerField(undefined, 'max', 5)).toBe(5);
    expect(integerField({}, 'max', 5)).toBe(5);
    expect(integerField({ max: 1.5 }, 'max', 5)).toBe(5);
    expect(integerField({ max: '2' }, 'max', 5)).toBe(5);
  });

  it('reads integers', () => {
    expect(integerField({ max: 1 }, 'max', 5)).toBe(1);
    expect(integerField({ max: 0 }, 'max', 5)).toBe(0);
  });
});

describe('stringField', () => {
  it('uses fallback unless the value is a string', () => {
    expect(stringField(undefined, 'pattern', 'x')).toBe('x');
    expect(stringField({ pattern: 1 }, 'pattern', 'x')).toBe('x');
    expect(stringField({ pattern: 'y' }, 'pattern', 'x')).toBe('y');
  });
});

describe('booleanField', () => {
  it('uses fallback unless the value is a boolean', () => {
    expect(booleanField(undefined, 'allowInTypeGuards', false)).toBe(false);
    expect(booleanField({ allowInTypeGuards: 'true' }, 'allowInTypeGuards', false)).toBe(false);
    expect(booleanField({ allowInTypeGuards: true }, 'allowInTypeGuards', false)).toBe(true);
  });
});

describe('stringListField', () => {
  it('keeps only string items', () => {
    expect(stringListField(undefined, 'allow', ['a'])).toEqual(['a']);
    expect(stringListField({ allow: 'a' }, 'allow', ['a'])).toEqual(['a']);
    expect(stringListField({ allow: ['a', 1, 'b'] }, 'allow', [])).toEqual(['a', 'b']);
  });
});
