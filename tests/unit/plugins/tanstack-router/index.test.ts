import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a bn- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'bn-create-route-property-order',
      'bn-no-dynamic-router-to',
      'bn-no-get-route-api',
      'bn-no-hooks-in-route-lifecycle',
      'bn-no-imperative-location-navigation',
      'bn-no-relative-router-to-without-from',
      'bn-no-router-href',
      'bn-no-router-type-assertion',
      'bn-no-search-in-loader',
      'bn-require-params-with-path-tokens',
      'bn-require-router-hook-from',
      'bn-require-throw-not-found',
      'bn-require-throw-redirect',
      'bn-require-validate-search-when-used',
    ]);
  });
});
