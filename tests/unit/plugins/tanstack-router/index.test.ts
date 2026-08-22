import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a vm- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'vm-no-dynamic-router-to',
      'vm-no-get-route-api',
      'vm-no-imperative-location-navigation',
      'vm-no-relative-router-to-without-from',
      'vm-no-router-href',
      'vm-no-router-type-assertion',
      'vm-require-router-hook-from',
    ]);
  });
});
