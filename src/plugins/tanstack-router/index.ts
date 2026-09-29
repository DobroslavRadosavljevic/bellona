import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  createRoutePropertyOrder,
  createRoutePropertyOrderName,
} from './rules/create-route-property-order.ts';
import {
  noControlFlowOutsideEdge,
  noControlFlowOutsideEdgeName,
} from './rules/no-control-flow-outside-edge.ts';
import { noDeprecatedApis, noDeprecatedApisName } from './rules/no-deprecated-apis.ts';
import { noDynamicRouterTo, noDynamicRouterToName } from './rules/no-dynamic-router-to.ts';
import { noGetRouteApi, noGetRouteApiName } from './rules/no-get-route-api.ts';
import {
  noImperativeLocationNavigation,
  noImperativeLocationNavigationName,
} from './rules/no-imperative-location-navigation.ts';
import {
  noLoaderDataInNotFound,
  noLoaderDataInNotFoundName,
} from './rules/no-loader-data-in-not-found.ts';
import {
  noNotFoundInComponent,
  noNotFoundInComponentName,
} from './rules/no-not-found-in-component.ts';
import { noNotFoundRoute, noNotFoundRouteName } from './rules/no-not-found-route.ts';
import {
  noRelativeRouterToWithoutFrom,
  noRelativeRouterToWithoutFromName,
} from './rules/no-relative-router-to-without-from.ts';
import { noRouterHref, noRouterHrefName } from './rules/no-router-href.ts';
import {
  noRouterTypeAssertion,
  noRouterTypeAssertionName,
} from './rules/no-router-type-assertion.ts';
import { noSearchInLoader, noSearchInLoaderName } from './rules/no-search-in-loader.ts';
import {
  noWholeSearchLoaderDeps,
  noWholeSearchLoaderDepsName,
} from './rules/no-whole-search-loader-deps.ts';
import {
  requireInlineRouteOptions,
  requireInlineRouteOptionsName,
} from './rules/require-inline-route-options.ts';
import {
  requireRouterHookFrom,
  requireRouterHookFromName,
} from './rules/require-router-hook-from.ts';
import { requireThrowNotFound, requireThrowNotFoundName } from './rules/require-throw-not-found.ts';
import { requireThrowRedirect, requireThrowRedirectName } from './rules/require-throw-redirect.ts';

const tanstackRouter = defineBellonaPlugin('bl-tanstack-router', {
  [createRoutePropertyOrderName]: createRoutePropertyOrder,
  [noControlFlowOutsideEdgeName]: noControlFlowOutsideEdge,
  [noDeprecatedApisName]: noDeprecatedApis,
  [noDynamicRouterToName]: noDynamicRouterTo,
  [noGetRouteApiName]: noGetRouteApi,
  [noImperativeLocationNavigationName]: noImperativeLocationNavigation,
  [noLoaderDataInNotFoundName]: noLoaderDataInNotFound,
  [noNotFoundInComponentName]: noNotFoundInComponent,
  [noNotFoundRouteName]: noNotFoundRoute,
  [noRelativeRouterToWithoutFromName]: noRelativeRouterToWithoutFrom,
  [noRouterHrefName]: noRouterHref,
  [noRouterTypeAssertionName]: noRouterTypeAssertion,
  [noSearchInLoaderName]: noSearchInLoader,
  [noWholeSearchLoaderDepsName]: noWholeSearchLoaderDeps,
  [requireRouterHookFromName]: requireRouterHookFrom,
  [requireInlineRouteOptionsName]: requireInlineRouteOptions,
  [requireThrowNotFoundName]: requireThrowNotFound,
  [requireThrowRedirectName]: requireThrowRedirect,
});

export default tanstackRouter;
export {
  createRoutePropertyOrder,
  createRoutePropertyOrderName,
  noControlFlowOutsideEdge,
  noControlFlowOutsideEdgeName,
  noDeprecatedApis,
  noDeprecatedApisName,
  noDynamicRouterTo,
  noDynamicRouterToName,
  noGetRouteApi,
  noGetRouteApiName,
  noImperativeLocationNavigation,
  noImperativeLocationNavigationName,
  noLoaderDataInNotFound,
  noLoaderDataInNotFoundName,
  noNotFoundInComponent,
  noNotFoundInComponentName,
  noNotFoundRoute,
  noNotFoundRouteName,
  noRelativeRouterToWithoutFrom,
  noRelativeRouterToWithoutFromName,
  noRouterHref,
  noRouterHrefName,
  noRouterTypeAssertion,
  noRouterTypeAssertionName,
  noSearchInLoader,
  noSearchInLoaderName,
  noWholeSearchLoaderDeps,
  noWholeSearchLoaderDepsName,
  requireInlineRouteOptions,
  requireInlineRouteOptionsName,
  requireRouterHookFrom,
  requireRouterHookFromName,
  requireThrowNotFound,
  requireThrowNotFoundName,
  requireThrowRedirect,
  requireThrowRedirectName,
};
