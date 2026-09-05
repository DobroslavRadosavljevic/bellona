import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a tanstack-router- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'create-route-property-order',
      'no-control-flow-outside-edge',
      'no-dynamic-to',
      'no-get-route-api',
      'no-hooks-in-route-lifecycle',
      'no-imperative-location-navigation',
      'no-loader-data-in-not-found',
      'no-not-found-in-component',
      'no-not-found-route',
      'no-relative-to-without-from',
      'no-href',
      'no-type-assertion',
      'no-search-in-loader',
      'require-params-with-path-tokens',
      'require-hook-from',
      'require-inline-route-options',
      'require-throw-not-found',
      'require-throw-redirect',
      'require-validate-search-when-used',
    ]);
  });
});
