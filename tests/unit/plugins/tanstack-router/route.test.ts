import { describe, expect, it } from 'vitest';

import {
  pathHasParamToken,
  pathHasRequiredParamToken,
  sortRoutePropertiesByOrder,
} from '../../../../src/plugins/tanstack-router/route.ts';

describe('pathHasParamToken', () => {
  it('detects $ tokens in static paths', () => {
    expect(pathHasParamToken('/posts/$postId')).toBe(true);
    expect(pathHasParamToken('../$id')).toBe(true);
    expect(pathHasParamToken('/posts/$')).toBe(true);
    expect(pathHasParamToken('/posts')).toBe(false);
    expect(pathHasParamToken('.')).toBe(false);
    expect(pathHasParamToken('..')).toBe(false);
  });
});

describe('pathHasRequiredParamToken', () => {
  it('treats required $ tokens as required', () => {
    expect(pathHasRequiredParamToken('/posts/$postId')).toBe(true);
    expect(pathHasRequiredParamToken('../$id')).toBe(true);
    expect(pathHasRequiredParamToken('/posts/$')).toBe(true);
  });

  it('treats optional brace tokens as not required', () => {
    expect(pathHasRequiredParamToken('/{-$locale}/blog/authors')).toBe(false);
    expect(pathHasRequiredParamToken('/posts/{-$category}')).toBe(false);
    expect(pathHasRequiredParamToken('/files/prefix{-$name}.txt')).toBe(false);
    expect(pathHasRequiredParamToken('/{-$year}/{-$month}/{-$day}')).toBe(false);
  });

  it('still requires params when a required token is mixed with optional tokens', () => {
    expect(pathHasRequiredParamToken('/{-$locale}/posts/$postId')).toBe(true);
  });

  it('ignores paths with no $ tokens', () => {
    expect(pathHasRequiredParamToken('/posts')).toBe(false);
    expect(pathHasRequiredParamToken('.')).toBe(false);
  });
});

describe('sortRoutePropertiesByOrder', () => {
  it('returns undefined when checked keys are already in order', () => {
    expect(
      sortRoutePropertiesByOrder([
        { name: 'validateSearch' },
        { name: 'loaderDeps' },
        { name: 'beforeLoad' },
        { name: 'loader' },
      ]),
    ).toBeUndefined();
  });

  it('ignores keys that are not inference-sensitive', () => {
    expect(
      sortRoutePropertiesByOrder([{ name: 'component' }, { name: 'pendingComponent' }]),
    ).toBeUndefined();
  });

  it('reorders checked keys and leaves others in place', () => {
    const result = sortRoutePropertiesByOrder([
      { name: 'component' },
      { name: 'loader' },
      { name: 'beforeLoad' },
    ]);
    expect(result?.map((item) => item.name)).toEqual(['component', 'beforeLoad', 'loader']);
  });

  it('treats params and validateSearch as the same early band', () => {
    expect(
      sortRoutePropertiesByOrder([{ name: 'params' }, { name: 'validateSearch' }]),
    ).toBeUndefined();
  });
});
