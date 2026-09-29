import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { hookAfterRoutes, hookAfterRoutesName } from './rules/hook-after-routes.ts';
import { noContextParam, noContextParamName } from './rules/no-context-param.ts';
import {
  noCookieUndefinedCheck,
  noCookieUndefinedCheckName,
} from './rules/no-cookie-undefined-check.ts';
import { noDecorateSingletons, noDecorateSingletonsName } from './rules/no-decorate-singletons.ts';
import {
  noElysiaFactoryFunction,
  noElysiaFactoryFunctionName,
} from './rules/no-elysia-factory-function.ts';
import {
  noFunctionalPluginCallback,
  noFunctionalPluginCallbackName,
} from './rules/no-functional-plugin-callback.ts';
import { noSetRedirect, noSetRedirectName } from './rules/no-set-redirect.ts';
import {
  oneRouteMethodPerFile,
  oneRouteMethodPerFileName,
} from './rules/one-route-method-per-file.ts';
import {
  preferEdenTreatyInTests,
  preferEdenTreatyInTestsName,
} from './rules/prefer-eden-treaty-in-tests.ts';
import { preferResolveForAuth, preferResolveForAuthName } from './rules/prefer-resolve-for-auth.ts';
import { preferStatusHelper, preferStatusHelperName } from './rules/prefer-status-helper.ts';
import { preferThrowStatus, preferThrowStatusName } from './rules/prefer-throw-status.ts';
import {
  requireErrorBodyLiteral,
  requireErrorBodyLiteralName,
} from './rules/require-error-body-literal.ts';
import { requirePluginName, requirePluginNameName } from './rules/require-plugin-name.ts';
import {
  requireResponseSchema,
  requireResponseSchemaName,
} from './rules/require-response-schema.ts';
import {
  requireRouteExportName,
  requireRouteExportNameName,
} from './rules/require-route-export-name.ts';
import { requireRouteSchema, requireRouteSchemaName } from './rules/require-route-schema.ts';
import { routesIndexMountOnly, routesIndexMountOnlyName } from './rules/routes-index-mount-only.ts';
import { statusCodeInResponse, statusCodeInResponseName } from './rules/status-code-in-response.ts';

const elysia = defineBellonaPlugin('bl-elysia', {
  [hookAfterRoutesName]: hookAfterRoutes,
  [noContextParamName]: noContextParam,
  [noCookieUndefinedCheckName]: noCookieUndefinedCheck,
  [noFunctionalPluginCallbackName]: noFunctionalPluginCallback,
  [noDecorateSingletonsName]: noDecorateSingletons,
  [noElysiaFactoryFunctionName]: noElysiaFactoryFunction,
  [noSetRedirectName]: noSetRedirect,
  [oneRouteMethodPerFileName]: oneRouteMethodPerFile,
  [preferEdenTreatyInTestsName]: preferEdenTreatyInTests,
  [preferResolveForAuthName]: preferResolveForAuth,
  [preferStatusHelperName]: preferStatusHelper,
  [preferThrowStatusName]: preferThrowStatus,
  [requireErrorBodyLiteralName]: requireErrorBodyLiteral,
  [requirePluginNameName]: requirePluginName,
  [requireResponseSchemaName]: requireResponseSchema,
  [requireRouteExportNameName]: requireRouteExportName,
  [requireRouteSchemaName]: requireRouteSchema,
  [routesIndexMountOnlyName]: routesIndexMountOnly,
  [statusCodeInResponseName]: statusCodeInResponse,
});

export default elysia;
export {
  hookAfterRoutes,
  hookAfterRoutesName,
  noContextParam,
  noContextParamName,
  noCookieUndefinedCheck,
  noCookieUndefinedCheckName,
  noFunctionalPluginCallback,
  noFunctionalPluginCallbackName,
  noDecorateSingletons,
  noDecorateSingletonsName,
  noElysiaFactoryFunction,
  noElysiaFactoryFunctionName,
  noSetRedirect,
  noSetRedirectName,
  oneRouteMethodPerFile,
  oneRouteMethodPerFileName,
  preferEdenTreatyInTests,
  preferEdenTreatyInTestsName,
  preferResolveForAuth,
  preferResolveForAuthName,
  preferStatusHelper,
  preferStatusHelperName,
  preferThrowStatus,
  preferThrowStatusName,
  requireErrorBodyLiteral,
  requireErrorBodyLiteralName,
  requirePluginName,
  requirePluginNameName,
  requireResponseSchema,
  requireResponseSchemaName,
  requireRouteExportName,
  requireRouteExportNameName,
  requireRouteSchema,
  requireRouteSchemaName,
  routesIndexMountOnly,
  routesIndexMountOnlyName,
  statusCodeInResponse,
  statusCodeInResponseName,
};
