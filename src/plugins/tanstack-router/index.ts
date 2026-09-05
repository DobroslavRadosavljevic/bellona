import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  createRoutePropertyOrder,
  createRoutePropertyOrderName,
} from './rules/create-route-property-order.ts';
import {
  noControlFlowOutsideEdge,
  noControlFlowOutsideEdgeName,
} from './rules/no-control-flow-outside-edge.ts';
import { noDynamicRouterTo, noDynamicRouterToName } from './rules/no-dynamic-router-to.ts';
import { noGetRouteApi, noGetRouteApiName } from './rules/no-get-route-api.ts';
import {
  noHooksInRouteLifecycle,
  noHooksInRouteLifecycleName,
} from './rules/no-hooks-in-route-lifecycle.ts';
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
  requireInlineRouteOptions,
  requireInlineRouteOptionsName,
} from './rules/require-inline-route-options.ts';
import {
  requireParamsWithPathTokens,
  requireParamsWithPathTokensName,
} from './rules/require-params-with-path-tokens.ts';
import {
  requireRouterHookFrom,
  requireRouterHookFromName,
} from './rules/require-router-hook-from.ts';
import { requireThrowNotFound, requireThrowNotFoundName } from './rules/require-throw-not-found.ts';
import { requireThrowRedirect, requireThrowRedirectName } from './rules/require-throw-redirect.ts';
import {
  requireValidateSearchWhenUsed,
  requireValidateSearchWhenUsedName,
} from './rules/require-validate-search-when-used.ts';

const tanstackRouter = defineBellonaPlugin('bl-tanstack-router', {
  [createRoutePropertyOrderName]: createRoutePropertyOrder,
  [noControlFlowOutsideEdgeName]: noControlFlowOutsideEdge,
  [noDynamicRouterToName]: noDynamicRouterTo,
  [noGetRouteApiName]: noGetRouteApi,
  [noHooksInRouteLifecycleName]: noHooksInRouteLifecycle,
  [noImperativeLocationNavigationName]: noImperativeLocationNavigation,
  [noLoaderDataInNotFoundName]: noLoaderDataInNotFound,
  [noNotFoundInComponentName]: noNotFoundInComponent,
  [noNotFoundRouteName]: noNotFoundRoute,
  [noRelativeRouterToWithoutFromName]: noRelativeRouterToWithoutFrom,
  [noRouterHrefName]: noRouterHref,
  [noRouterTypeAssertionName]: noRouterTypeAssertion,
  [noSearchInLoaderName]: noSearchInLoader,
  [requireParamsWithPathTokensName]: requireParamsWithPathTokens,
  [requireRouterHookFromName]: requireRouterHookFrom,
  [requireInlineRouteOptionsName]: requireInlineRouteOptions,
  [requireThrowNotFoundName]: requireThrowNotFound,
  [requireThrowRedirectName]: requireThrowRedirect,
  [requireValidateSearchWhenUsedName]: requireValidateSearchWhenUsed,
});

export default tanstackRouter;
export {
  createRoutePropertyOrder,
  createRoutePropertyOrderName,
  noControlFlowOutsideEdge,
  noControlFlowOutsideEdgeName,
  noDynamicRouterTo,
  noDynamicRouterToName,
  noGetRouteApi,
  noGetRouteApiName,
  noHooksInRouteLifecycle,
  noHooksInRouteLifecycleName,
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
  requireInlineRouteOptions,
  requireInlineRouteOptionsName,
  requireParamsWithPathTokens,
  requireParamsWithPathTokensName,
  requireRouterHookFrom,
  requireRouterHookFromName,
  requireThrowNotFound,
  requireThrowNotFoundName,
  requireThrowRedirect,
  requireThrowRedirectName,
  requireValidateSearchWhenUsed,
  requireValidateSearchWhenUsedName,
};
