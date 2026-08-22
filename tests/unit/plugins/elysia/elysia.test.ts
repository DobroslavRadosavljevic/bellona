import { describe, expect, it } from 'vitest';

import {
  camelCaseToScreamingSnake,
  isRouteExportName,
  routePathHasParams,
} from '../../../../src/plugins/elysia/elysia.ts';

describe('routePathHasParams', () => {
  it('detects :param segments', () => {
    expect(routePathHasParams('/:id')).toBe(true);
    expect(routePathHasParams('/users/:userId/posts/:postId')).toBe(true);
    expect(routePathHasParams('/:id?')).toBe(true);
  });

  it('ignores static paths and wildcards without a colon', () => {
    expect(routePathHasParams('/users')).toBe(false);
    expect(routePathHasParams('/')).toBe(false);
    expect(routePathHasParams('/*')).toBe(false);
  });
});

describe('isRouteExportName', () => {
  it('accepts camelCase Route and Routes suffixes', () => {
    expect(isRouteExportName('billingStatusRoute')).toBe(true);
    expect(isRouteExportName('creditsRoutes')).toBe(true);
  });

  it('rejects PascalCase, SCREAMING, and missing suffixes', () => {
    expect(isRouteExportName('StatusRoute')).toBe(false);
    expect(isRouteExportName('BILLING_STATUS_ROUTE')).toBe(false);
    expect(isRouteExportName('billingStatus')).toBe(false);
  });
});

describe('camelCaseToScreamingSnake', () => {
  it('converts camelCase route exports', () => {
    expect(camelCaseToScreamingSnake('billingStatusRoute')).toBe('BILLING_STATUS_ROUTE');
    expect(camelCaseToScreamingSnake('creditsRoutes')).toBe('CREDITS_ROUTES');
  });
});
