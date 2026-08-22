import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a vm- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'vm-create-route-property-order',
      'vm-no-dynamic-router-to',
      'vm-no-get-route-api',
      'vm-no-hooks-in-route-lifecycle',
      'vm-no-imperative-location-navigation',
      'vm-no-relative-router-to-without-from',
      'vm-no-router-href',
      'vm-no-router-type-assertion',
      'vm-no-search-in-loader',
      'vm-require-params-with-path-tokens',
      'vm-require-router-hook-from',
      'vm-require-throw-not-found',
      'vm-require-throw-redirect',
      'vm-require-validate-search-when-used',
    ]);
  });
});
