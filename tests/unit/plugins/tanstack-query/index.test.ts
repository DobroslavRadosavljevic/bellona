import { describe, expect, it } from 'vitest';

import tanstackQuery from '../../../../src/plugins/tanstack-query/index.ts';

describe('tanstack-query plugin', () => {
  it('registers the opt-in rules with a unique plugin name', () => {
    expect(tanstackQuery.meta.name).toBe('bl-tanstack-query');
    expect(Object.keys(tanstackQuery.rules)).toEqual([
      'exhaustive-deps',
      'no-deprecated-client-methods',
      'no-deprecated-imports',
      'no-deprecated-query-context',
      'no-deprecated-results',
      'no-removed-options',
      'no-rest-destructuring',
      'no-unstable-deps',
      'stable-query-client',
    ]);
    expect('configs' in tanstackQuery).toBe(false);
  });
});
