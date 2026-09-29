import { describe, expect, it } from 'vitest';

import tanstackRouter from '../../../../src/plugins/tanstack-router/index.ts';

describe('tanstack-router plugin', () => {
  it('registers every router rule under a tanstack-router- id', () => {
    expect(Object.keys(tanstackRouter.rules)).toEqual([
      'create-route-property-order',
      'no-control-flow-outside-edge',
      'no-deprecated-apis',
      'no-dynamic-to',
      'no-get-route-api',
      'no-imperative-location-navigation',
      'no-loader-data-in-not-found',
      'no-not-found-in-component',
      'no-not-found-route',
      'no-relative-to-without-from',
      'no-href',
      'no-type-assertion',
      'no-search-in-loader',
      'no-whole-search-loader-deps',
      'require-hook-from',
      'require-inline-route-options',
      'require-throw-not-found',
      'require-throw-redirect',
    ]);
  });
});
