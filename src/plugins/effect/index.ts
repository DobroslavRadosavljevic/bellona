import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  effectFunctionsInServices,
  effectFunctionsInServicesName,
} from './rules/effect-functions-in-services.ts';
import { maxServiceMethods, maxServiceMethodsName } from './rules/max-service-methods.ts';
import { maxServices, maxServicesName } from './rules/max-services.ts';
import { noDateNowInEffect, noDateNowInEffectName } from './rules/no-date-now-in-effect.ts';
import {
  noDuplicateLayerConstruction,
  noDuplicateLayerConstructionName,
} from './rules/no-duplicate-layer-construction.ts';
import { noEagerAcquire, noEagerAcquireName } from './rules/no-eager-acquire.ts';
import { noEffectRunInTests, noEffectRunInTestsName } from './rules/no-effect-run-in-tests.ts';
import { noFloatingEffect, noFloatingEffectName } from './rules/no-floating-effect.ts';
import { noForkDetach, noForkDetachName } from './rules/no-fork-detach.ts';
import { noForwardingService, noForwardingServiceName } from './rules/no-forwarding-service.ts';
import {
  noInferredServiceContract,
  noInferredServiceContractName,
} from './rules/no-inferred-service-contract.ts';
import {
  noInterpolatedLogMessage,
  noInterpolatedLogMessageName,
} from './rules/no-interpolated-log-message.ts';
import { noItEffectScoped, noItEffectScopedName } from './rules/no-it-effect-scoped.ts';
import { noLogAndRethrow, noLogAndRethrowName } from './rules/no-log-and-rethrow.ts';
import {
  noModuleLevelMutableState,
  noModuleLevelMutableStateName,
} from './rules/no-module-level-mutable-state.ts';
import { noNewErrorInEffect, noNewErrorInEffectName } from './rules/no-new-error-in-effect.ts';
import {
  noPerCallCacheConstruction,
  noPerCallCacheConstructionName,
} from './rules/no-per-call-cache-construction.ts';
import { noReturnEffectInGen, noReturnEffectInGenName } from './rules/no-return-effect-in-gen.ts';
import {
  noRunPromiseInModules,
  noRunPromiseInModulesName,
} from './rules/no-run-promise-in-modules.ts';
import { noServiceMakeFactory, noServiceMakeFactoryName } from './rules/no-service-make-factory.ts';
import { noSilentCatchCause, noSilentCatchCauseName } from './rules/no-silent-catch-cause.ts';
import {
  noStatusInTaggedError,
  noStatusInTaggedErrorName,
} from './rules/no-status-in-tagged-error.ts';
import { noThrowInEffectGen, noThrowInEffectGenName } from './rules/no-throw-in-effect-gen.ts';
import {
  noTryCatchInEffectGen,
  noTryCatchInEffectGenName,
} from './rules/no-try-catch-in-effect-gen.ts';
import { noV3EffectApis, noV3EffectApisName } from './rules/no-v3-effect-apis.ts';
import { noV3Imports, noV3ImportsName } from './rules/no-v3-imports.ts';
import { noV3ServiceTags, noV3ServiceTagsName } from './rules/no-v3-service-tags.ts';
import { noYieldRefHandle, noYieldRefHandleName } from './rules/no-yield-ref-handle.ts';
import { preferClockSleep, preferClockSleepName } from './rules/prefer-clock-sleep.ts';
import {
  preferDecodeUnknownEffect,
  preferDecodeUnknownEffectName,
} from './rules/prefer-decode-unknown-effect.ts';
import { preferEffectFn, preferEffectFnName } from './rules/prefer-effect-fn.ts';
import { preferEffectVitest, preferEffectVitestName } from './rules/prefer-effect-vitest.ts';
import {
  preferFnUntracedInCallbacks,
  preferFnUntracedInCallbacksName,
} from './rules/prefer-fn-untraced-in-callbacks.ts';
import { preferPredicate, preferPredicateName } from './rules/prefer-predicate.ts';
import {
  preferSchemaTaggedError,
  preferSchemaTaggedErrorName,
} from './rules/prefer-schema-tagged-error.ts';
import { preferServiceOf, preferServiceOfName } from './rules/prefer-service-of.ts';
import { preferTryPromise, preferTryPromiseName } from './rules/prefer-try-promise.ts';
import {
  requireBoundedConcurrency,
  requireBoundedConcurrencyName,
} from './rules/require-bounded-concurrency.ts';
import { requireBoundedRetry, requireBoundedRetryName } from './rules/require-bounded-retry.ts';
import { requireDefectCause, requireDefectCauseName } from './rules/require-defect-cause.ts';
import { requireEffectFnName, requireEffectFnNameName } from './rules/require-effect-fn-name.ts';
import { requireFnOwnerPrefix, requireFnOwnerPrefixName } from './rules/require-fn-owner-prefix.ts';
import {
  requireFnReturnAnnotation,
  requireFnReturnAnnotationName,
} from './rules/require-fn-return-annotation.ts';
import {
  requireGenSelfOptions,
  requireGenSelfOptionsName,
} from './rules/require-gen-self-options.ts';
import { requireIgnoreLog, requireIgnoreLogName } from './rules/require-ignore-log.ts';
import {
  requirePromiseAbortSignal,
  requirePromiseAbortSignalName,
} from './rules/require-promise-abort-signal.ts';
import {
  requireRedactedSecretConfig,
  requireRedactedSecretConfigName,
} from './rules/require-redacted-secret-config.ts';
import {
  requireReturnYieldOnFail,
  requireReturnYieldOnFailName,
} from './rules/require-return-yield-on-fail.ts';
import {
  requireServiceFilename,
  requireServiceFilenameName,
} from './rules/require-service-filename.ts';
import { requireServiceIdPath, requireServiceIdPathName } from './rules/require-service-id-path.ts';
import {
  requireServiceStaticLayer,
  requireServiceStaticLayerName,
} from './rules/require-service-static-layer.ts';
import {
  requireTimeoutOnExternalIo,
  requireTimeoutOnExternalIoName,
} from './rules/require-timeout-on-external-io.ts';
import { schemaNoLegacyFilter, schemaNoLegacyFilterName } from './rules/schema-no-legacy-filter.ts';
import { schemaUnionArray, schemaUnionArrayName } from './rules/schema-union-array.ts';
const effect = defineBellonaPlugin('bl-effect', {
  [effectFunctionsInServicesName]: effectFunctionsInServices,
  [maxServiceMethodsName]: maxServiceMethods,
  [noSilentCatchCauseName]: noSilentCatchCause,
  [requireIgnoreLogName]: requireIgnoreLog,
  [noForkDetachName]: noForkDetach,
  [requireDefectCauseName]: requireDefectCause,
  [noNewErrorInEffectName]: noNewErrorInEffect,
  [requireBoundedRetryName]: requireBoundedRetry,
  [requireBoundedConcurrencyName]: requireBoundedConcurrency,
  [noEagerAcquireName]: noEagerAcquire,
  [noEffectRunInTestsName]: noEffectRunInTests,
  [noFloatingEffectName]: noFloatingEffect,
  [noReturnEffectInGenName]: noReturnEffectInGen,
  [noServiceMakeFactoryName]: noServiceMakeFactory,
  [noStatusInTaggedErrorName]: noStatusInTaggedError,
  [preferFnUntracedInCallbacksName]: preferFnUntracedInCallbacks,
  [requireFnOwnerPrefixName]: requireFnOwnerPrefix,
  [requirePromiseAbortSignalName]: requirePromiseAbortSignal,
  [maxServicesName]: maxServices,
  [noDateNowInEffectName]: noDateNowInEffect,
  [noItEffectScopedName]: noItEffectScoped,
  [noRunPromiseInModulesName]: noRunPromiseInModules,
  [noThrowInEffectGenName]: noThrowInEffectGen,
  [noTryCatchInEffectGenName]: noTryCatchInEffectGen,
  [noV3EffectApisName]: noV3EffectApis,
  [noV3ImportsName]: noV3Imports,
  [noV3ServiceTagsName]: noV3ServiceTags,
  [noYieldRefHandleName]: noYieldRefHandle,
  [preferClockSleepName]: preferClockSleep,
  [preferDecodeUnknownEffectName]: preferDecodeUnknownEffect,
  [preferEffectFnName]: preferEffectFn,
  [preferEffectVitestName]: preferEffectVitest,
  [preferPredicateName]: preferPredicate,
  [preferSchemaTaggedErrorName]: preferSchemaTaggedError,
  [preferServiceOfName]: preferServiceOf,
  [preferTryPromiseName]: preferTryPromise,
  [requireEffectFnNameName]: requireEffectFnName,
  [requireGenSelfOptionsName]: requireGenSelfOptions,
  [requireReturnYieldOnFailName]: requireReturnYieldOnFail,
  [requireServiceFilenameName]: requireServiceFilename,
  [requireServiceIdPathName]: requireServiceIdPath,
  [requireServiceStaticLayerName]: requireServiceStaticLayer,
  [schemaNoLegacyFilterName]: schemaNoLegacyFilter,
  [schemaUnionArrayName]: schemaUnionArray,
  [noInferredServiceContractName]: noInferredServiceContract,
  [noForwardingServiceName]: noForwardingService,
  [noPerCallCacheConstructionName]: noPerCallCacheConstruction,
  [noModuleLevelMutableStateName]: noModuleLevelMutableState,
  [noDuplicateLayerConstructionName]: noDuplicateLayerConstruction,
  [requireRedactedSecretConfigName]: requireRedactedSecretConfig,
  [requireTimeoutOnExternalIoName]: requireTimeoutOnExternalIo,
  [noInterpolatedLogMessageName]: noInterpolatedLogMessage,
  [noLogAndRethrowName]: noLogAndRethrow,
  [requireFnReturnAnnotationName]: requireFnReturnAnnotation,
});

export default effect;
export {
  effectFunctionsInServices,
  effectFunctionsInServicesName,
  maxServiceMethods,
  maxServiceMethodsName,
  noSilentCatchCause,
  noSilentCatchCauseName,
  requireIgnoreLog,
  requireIgnoreLogName,
  noForkDetach,
  noForkDetachName,
  requireDefectCause,
  requireDefectCauseName,
  noNewErrorInEffect,
  noNewErrorInEffectName,
  requireBoundedRetry,
  requireBoundedRetryName,
  requireBoundedConcurrency,
  requireBoundedConcurrencyName,
  noEagerAcquire,
  noEagerAcquireName,
  noEffectRunInTests,
  noEffectRunInTestsName,
  noFloatingEffect,
  noFloatingEffectName,
  noReturnEffectInGen,
  noReturnEffectInGenName,
  noServiceMakeFactory,
  noServiceMakeFactoryName,
  noStatusInTaggedError,
  noStatusInTaggedErrorName,
  preferFnUntracedInCallbacks,
  preferFnUntracedInCallbacksName,
  requireFnOwnerPrefix,
  requireFnOwnerPrefixName,
  requirePromiseAbortSignal,
  requirePromiseAbortSignalName,
  maxServices,
  maxServicesName,
  noDateNowInEffect,
  noDateNowInEffectName,
  noItEffectScoped,
  noItEffectScopedName,
  noRunPromiseInModules,
  noRunPromiseInModulesName,
  noThrowInEffectGen,
  noThrowInEffectGenName,
  noTryCatchInEffectGen,
  noTryCatchInEffectGenName,
  noV3EffectApis,
  noV3EffectApisName,
  noV3Imports,
  noV3ImportsName,
  noV3ServiceTags,
  noV3ServiceTagsName,
  noYieldRefHandle,
  noYieldRefHandleName,
  preferClockSleep,
  preferClockSleepName,
  preferDecodeUnknownEffect,
  preferDecodeUnknownEffectName,
  preferEffectFn,
  preferEffectFnName,
  preferEffectVitest,
  preferEffectVitestName,
  preferPredicate,
  preferPredicateName,
  preferSchemaTaggedError,
  preferSchemaTaggedErrorName,
  preferServiceOf,
  preferServiceOfName,
  preferTryPromise,
  preferTryPromiseName,
  requireEffectFnName,
  requireEffectFnNameName,
  requireGenSelfOptions,
  requireGenSelfOptionsName,
  requireReturnYieldOnFail,
  requireReturnYieldOnFailName,
  requireServiceFilename,
  requireServiceFilenameName,
  requireServiceIdPath,
  requireServiceIdPathName,
  requireServiceStaticLayer,
  requireServiceStaticLayerName,
  schemaNoLegacyFilter,
  schemaNoLegacyFilterName,
  schemaUnionArray,
  schemaUnionArrayName,
  noInferredServiceContract,
  noInferredServiceContractName,
  noForwardingService,
  noForwardingServiceName,
  noPerCallCacheConstruction,
  noPerCallCacheConstructionName,
  noModuleLevelMutableState,
  noModuleLevelMutableStateName,
  noDuplicateLayerConstruction,
  noDuplicateLayerConstructionName,
  requireRedactedSecretConfig,
  requireRedactedSecretConfigName,
  requireTimeoutOnExternalIo,
  requireTimeoutOnExternalIoName,
  noInterpolatedLogMessage,
  noInterpolatedLogMessageName,
  noLogAndRethrow,
  noLogAndRethrowName,
  requireFnReturnAnnotation,
  requireFnReturnAnnotationName,
};
