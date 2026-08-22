import { defineVamanaPlugin } from '../../lib/plugin.ts';
import { noDynamicRouterTo, noDynamicRouterToName } from './rules/no-dynamic-router-to.ts';
import { noGetRouteApi, noGetRouteApiName } from './rules/no-get-route-api.ts';
import {
  noImperativeLocationNavigation,
  noImperativeLocationNavigationName,
} from './rules/no-imperative-location-navigation.ts';
import {
  noRelativeRouterToWithoutFrom,
  noRelativeRouterToWithoutFromName,
} from './rules/no-relative-router-to-without-from.ts';
import { noRouterHref, noRouterHrefName } from './rules/no-router-href.ts';
import {
  noRouterTypeAssertion,
  noRouterTypeAssertionName,
} from './rules/no-router-type-assertion.ts';
import {
  requireRouterHookFrom,
  requireRouterHookFromName,
} from './rules/require-router-hook-from.ts';

const tanstackRouter = defineVamanaPlugin('tanstack-router', {
  [noDynamicRouterToName]: noDynamicRouterTo,
  [noGetRouteApiName]: noGetRouteApi,
  [noImperativeLocationNavigationName]: noImperativeLocationNavigation,
  [noRelativeRouterToWithoutFromName]: noRelativeRouterToWithoutFrom,
  [noRouterHrefName]: noRouterHref,
  [noRouterTypeAssertionName]: noRouterTypeAssertion,
  [requireRouterHookFromName]: requireRouterHookFrom,
});

export default tanstackRouter;
export {
  noDynamicRouterTo,
  noDynamicRouterToName,
  noGetRouteApi,
  noGetRouteApiName,
  noImperativeLocationNavigation,
  noImperativeLocationNavigationName,
  noRelativeRouterToWithoutFrom,
  noRelativeRouterToWithoutFromName,
  noRouterHref,
  noRouterHrefName,
  noRouterTypeAssertion,
  noRouterTypeAssertionName,
  requireRouterHookFrom,
  requireRouterHookFromName,
};
