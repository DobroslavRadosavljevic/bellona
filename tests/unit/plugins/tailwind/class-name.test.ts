import { describe, expect, it } from 'vitest';

import {
  classifyClassToken,
  isClassNameBinding,
  isTailwindToken,
  looksLikeClassNameList,
} from '../../../../src/plugins/tailwind/class-name.ts';

describe('isClassNameBinding', () => {
  it('matches class name bindings', () => {
    expect(isClassNameBinding('lightboxControlClassName')).toBe(true);
    expect(isClassNameBinding('buttonClasses')).toBe(true);
    expect(isClassNameBinding('CLASS_NAMES')).toBe(true);
    expect(isClassNameBinding('classic')).toBe(false);
    expect(isClassNameBinding('label')).toBe(false);
  });
});

describe('classifyClassToken', () => {
  it('marks distinctive utilities as strong', () => {
    expect(classifyClassToken('items-center')).toBe('strong');
    expect(classifyClassToken('gap-2')).toBe('strong');
    expect(classifyClassToken('hover:bg-white/10')).toBe('strong');
    expect(classifyClassToken('data-pressed:bg-white/16')).toBe('strong');
    expect(classifyClassToken('focus-visible:ring-white')).toBe('strong');
    expect(classifyClassToken('text-[#fff]')).toBe('strong');
    expect(classifyClassToken('sr-only')).toBe('strong');
    expect(classifyClassToken('!flex')).toBe('strong');
    expect(classifyClassToken('-mt-4')).toBe('strong');
    expect(classifyClassToken('from-red-500')).toBe('strong');
  });

  it('marks ambiguous bare words as weak', () => {
    expect(classifyClassToken('flex')).toBe('weak');
    expect(classifyClassToken('hidden')).toBe('weak');
    expect(classifyClassToken('relative')).toBe('weak');
    expect(classifyClassToken('table')).toBe('weak');
  });

  it('rejects English, MIME, and unknown suffixes', () => {
    expect(classifyClassToken('hello')).toBe('other');
    expect(classifyClassToken('application/json')).toBe('other');
    expect(classifyClassToken('end-user')).toBe('other');
    expect(classifyClassToken('top-level')).toBe('other');
    expect(classifyClassToken('from-scratch')).toBe('other');
    expect(classifyClassToken('size-limit')).toBe('other');
    expect(classifyClassToken('order-id')).toBe('other');
    expect(classifyClassToken('the')).toBe('other');
  });
});

describe('isTailwindToken', () => {
  it('accepts utilities and rejects prose tokens', () => {
    expect(isTailwindToken('flex')).toBe(true);
    expect(isTailwindToken('items-center')).toBe(true);
    expect(isTailwindToken('hello')).toBe(false);
    expect(isTailwindToken('application/json')).toBe(false);
  });
});

describe('looksLikeClassNameList', () => {
  it('flags real class lists and skips lookalikes', () => {
    expect(looksLikeClassNameList('flex items-center', 2, false)).toBe(true);
    expect(looksLikeClassNameList('flex items-center text-white', 2, false)).toBe(true);
    expect(looksLikeClassNameList('text-white hover:bg-white/10', 2, false)).toBe(true);
    expect(looksLikeClassNameList('flex your muscles', 2, false)).toBe(false);
    expect(looksLikeClassNameList('Use flex items-center in the docs', 2, false)).toBe(false);
    expect(looksLikeClassNameList('flex grid', 2, false)).toBe(false);
    expect(looksLikeClassNameList('relative absolute', 2, false)).toBe(false);
    expect(looksLikeClassNameList('end-user top-level', 2, false)).toBe(false);
    expect(looksLikeClassNameList('hidden', 2, false)).toBe(false);
    expect(looksLikeClassNameList('hidden', 2, true)).toBe(true);
    expect(looksLikeClassNameList('flex grid', 2, true)).toBe(true);
    expect(looksLikeClassNameList('application/json', 2, false)).toBe(false);
    expect(looksLikeClassNameList('Settings', 2, false)).toBe(false);
    expect(looksLikeClassNameList('display: flex', 2, false)).toBe(false);
    expect(looksLikeClassNameList('https://example.com/flex', 2, false)).toBe(false);
    expect(looksLikeClassNameList('Please hide the table.', 2, false)).toBe(false);
  });
});
