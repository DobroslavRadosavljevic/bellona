import { describe, expect, it } from 'vitest';

import {
  pathHasParamToken,
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
