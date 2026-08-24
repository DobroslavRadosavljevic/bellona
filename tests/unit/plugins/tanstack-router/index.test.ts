import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a tanstack-router- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'tanstack-router-create-route-property-order',
      'tanstack-router-no-dynamic-to',
      'tanstack-router-no-get-route-api',
      'tanstack-router-no-hooks-in-route-lifecycle',
      'tanstack-router-no-imperative-location-navigation',
      'tanstack-router-no-relative-to-without-from',
      'tanstack-router-no-href',
      'tanstack-router-no-type-assertion',
      'tanstack-router-no-search-in-loader',
      'tanstack-router-require-params-with-path-tokens',
      'tanstack-router-require-hook-from',
      'tanstack-router-require-throw-not-found',
      'tanstack-router-require-throw-redirect',
      'tanstack-router-require-validate-search-when-used',
    ]);
  });
});
