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

  it('rejects English, MIME, and unknown prefixes', () => {
    expect(classifyClassToken('hello')).toBe('other');
    expect(classifyClassToken('application/json')).toBe('other');
    expect(classifyClassToken('text/plain')).toBe('other');
    expect(classifyClassToken('the')).toBe('other');
    expect(classifyClassToken('v1.2.3')).toBe('other');
  });

  it('marks a known prefix with a project value as weak', () => {
    expect(classifyClassToken('end-user')).toBe('weak');
    expect(classifyClassToken('top-level')).toBe('weak');
    expect(classifyClassToken('from-scratch')).toBe('weak');
    expect(classifyClassToken('size-limit')).toBe('weak');
    expect(classifyClassToken('order-id')).toBe('weak');
  });

  it('knows Tailwind v4 theme values and syntax', () => {
    expect(classifyClassToken('bg-primary')).toBe('weak');
    expect(classifyClassToken('text-muted-foreground')).toBe('weak');
    expect(classifyClassToken('hover:bg-accent')).toBe('strong');
    expect(classifyClassToken('text-secondary-foreground/80')).toBe('strong');
    expect(classifyClassToken('bg-mauve-500')).toBe('strong');
    expect(classifyClassToken('text-base')).toBe('strong');
    expect(classifyClassToken('shadow-2xs')).toBe('strong');
    expect(classifyClassToken('from-10%')).toBe('strong');
    expect(classifyClassToken('w-(--sidebar-width)')).toBe('strong');
    expect(classifyClassToken('bg-(color:--brand)')).toBe('strong');
    expect(classifyClassToken('supports-(display:grid):grid')).toBe('strong');
    expect(classifyClassToken('flex!')).toBe('strong');
    expect(classifyClassToken('gap-1.5')).toBe('strong');
    expect(classifyClassToken('inline-flex')).toBe('strong');
    expect(classifyClassToken('tabular-nums')).toBe('strong');
    expect(classifyClassToken('@container')).toBe('strong');
    expect(classifyClassToken('@container/main')).toBe('strong');
    expect(classifyClassToken('group/item')).toBe('strong');
    expect(classifyClassToken('group-hover/item:visible')).toBe('strong');
    expect(classifyClassToken('group')).toBe('weak');
    expect(classifyClassToken('field-sizing-content')).toBe('weak');
    expect(classifyClassToken('mask-b-from-10%')).toBe('weak');
    expect(classifyClassToken('[&:not(:last-child)>td]:border-b')).toBe('strong');
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

  it('flags Tailwind v4 class lists', () => {
    expect(looksLikeClassNameList('flex gap-1.5 items-center', 2, false)).toBe(true);
    expect(looksLikeClassNameList('!flex items-center', 2, false)).toBe(true);
    expect(looksLikeClassNameList('flex! items-center', 2, false)).toBe(true);
    expect(looksLikeClassNameList('w-(--sidebar-width) flex', 2, false)).toBe(true);
    expect(looksLikeClassNameList('inline-flex items-center bg-primary', 2, false)).toBe(true);
    expect(looksLikeClassNameList('transition-colors ease-out duration-200', 2, false)).toBe(true);
    expect(looksLikeClassNameList('group/item relative flex', 2, false)).toBe(true);
    expect(looksLikeClassNameList('text-xs text-secondary-foreground/80', 2, true)).toBe(true);
  });

  it('skips prose and theme-like words without a strong utility', () => {
    expect(looksLikeClassNameList('bg-primary text-primary-foreground', 2, false)).toBe(false);
    expect(looksLikeClassNameList('from start to end', 2, false)).toBe(false);
    expect(looksLikeClassNameList('Save (draft) now', 2, false)).toBe(false);
    expect(looksLikeClassNameList('v1.2.3 build', 2, false)).toBe(false);
    expect(looksLikeClassNameList('flex (items)', 2, false)).toBe(false);
    expect(looksLikeClassNameList('wait! flex', 2, false)).toBe(false);
  });
});
