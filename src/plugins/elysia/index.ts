import { defineVamanaPlugin } from '../../lib/plugin.ts';
import { noContextParam, noContextParamName } from './rules/no-context-param.ts';
import {
  noControllerContextClass,
  noControllerContextClassName,
} from './rules/no-controller-context-class.ts';
import {
  noCookieUndefinedCheck,
  noCookieUndefinedCheckName,
} from './rules/no-cookie-undefined-check.ts';
import {
  noFunctionalPluginCallback,
  noFunctionalPluginCallbackName,
} from './rules/no-functional-plugin-callback.ts';
import { noRouteFactory, noRouteFactoryName } from './rules/no-route-factory.ts';
import {
  oneRouteMethodPerFile,
  oneRouteMethodPerFileName,
} from './rules/one-route-method-per-file.ts';
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

const elysia = defineVamanaPlugin('elysia', {
  [noContextParamName]: noContextParam,
  [noControllerContextClassName]: noControllerContextClass,
  [noCookieUndefinedCheckName]: noCookieUndefinedCheck,
  [noFunctionalPluginCallbackName]: noFunctionalPluginCallback,
  [noRouteFactoryName]: noRouteFactory,
  [oneRouteMethodPerFileName]: oneRouteMethodPerFile,
  [preferResolveForAuthName]: preferResolveForAuth,
  [preferStatusHelperName]: preferStatusHelper,
  [preferThrowStatusName]: preferThrowStatus,
  [requireErrorBodyLiteralName]: requireErrorBodyLiteral,
  [requirePluginNameName]: requirePluginName,
  [requireResponseSchemaName]: requireResponseSchema,
  [requireRouteExportNameName]: requireRouteExportName,
  [requireRouteSchemaName]: requireRouteSchema,
  [routesIndexMountOnlyName]: routesIndexMountOnly,
});

export default elysia;
export {
  noContextParam,
  noContextParamName,
  noControllerContextClass,
  noControllerContextClassName,
  noCookieUndefinedCheck,
  noCookieUndefinedCheckName,
  noFunctionalPluginCallback,
  noFunctionalPluginCallbackName,
  noRouteFactory,
  noRouteFactoryName,
  oneRouteMethodPerFile,
  oneRouteMethodPerFileName,
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
};
