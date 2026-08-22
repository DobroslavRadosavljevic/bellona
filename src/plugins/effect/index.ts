import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { noDateNowInEffect, noDateNowInEffectName } from './rules/no-date-now-in-effect.ts';
import { noItEffectScoped, noItEffectScopedName } from './rules/no-it-effect-scoped.ts';
import { noPipeOnEffectFn, noPipeOnEffectFnName } from './rules/no-pipe-on-effect-fn.ts';
import {
  noRunPromiseInModules,
  noRunPromiseInModulesName,
} from './rules/no-run-promise-in-modules.ts';
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
import { preferDateFromString, preferDateFromStringName } from './rules/prefer-date-from-string.ts';
import {
  preferDecodeUnknownEffect,
  preferDecodeUnknownEffectName,
} from './rules/prefer-decode-unknown-effect.ts';
import { preferEffectFn, preferEffectFnName } from './rules/prefer-effect-fn.ts';
import { preferEffectVitest, preferEffectVitestName } from './rules/prefer-effect-vitest.ts';
import { preferPredicate, preferPredicateName } from './rules/prefer-predicate.ts';
import {
  preferSchemaTaggedError,
  preferSchemaTaggedErrorName,
} from './rules/prefer-schema-tagged-error.ts';
import { preferServiceOf, preferServiceOfName } from './rules/prefer-service-of.ts';
import { preferTryPromise, preferTryPromiseName } from './rules/prefer-try-promise.ts';
import { requireEffectFnName, requireEffectFnNameName } from './rules/require-effect-fn-name.ts';
import {
  requireReturnYieldOnFail,
  requireReturnYieldOnFailName,
} from './rules/require-return-yield-on-fail.ts';
import { requireServiceIdPath, requireServiceIdPathName } from './rules/require-service-id-path.ts';
import {
  requireServiceStaticLayer,
  requireServiceStaticLayerName,
} from './rules/require-service-static-layer.ts';
import { schemaNoLegacyFilter, schemaNoLegacyFilterName } from './rules/schema-no-legacy-filter.ts';
import { schemaUnionArray, schemaUnionArrayName } from './rules/schema-union-array.ts';

const effect = defineBellonaPlugin('effect', {
  [noDateNowInEffectName]: noDateNowInEffect,
  [noItEffectScopedName]: noItEffectScoped,
  [noPipeOnEffectFnName]: noPipeOnEffectFn,
  [noRunPromiseInModulesName]: noRunPromiseInModules,
  [noThrowInEffectGenName]: noThrowInEffectGen,
  [noTryCatchInEffectGenName]: noTryCatchInEffectGen,
  [noV3EffectApisName]: noV3EffectApis,
  [noV3ImportsName]: noV3Imports,
  [noV3ServiceTagsName]: noV3ServiceTags,
  [noYieldRefHandleName]: noYieldRefHandle,
  [preferClockSleepName]: preferClockSleep,
  [preferDateFromStringName]: preferDateFromString,
  [preferDecodeUnknownEffectName]: preferDecodeUnknownEffect,
  [preferEffectFnName]: preferEffectFn,
  [preferEffectVitestName]: preferEffectVitest,
  [preferPredicateName]: preferPredicate,
  [preferSchemaTaggedErrorName]: preferSchemaTaggedError,
  [preferServiceOfName]: preferServiceOf,
  [preferTryPromiseName]: preferTryPromise,
  [requireEffectFnNameName]: requireEffectFnName,
  [requireReturnYieldOnFailName]: requireReturnYieldOnFail,
  [requireServiceIdPathName]: requireServiceIdPath,
  [requireServiceStaticLayerName]: requireServiceStaticLayer,
  [schemaNoLegacyFilterName]: schemaNoLegacyFilter,
  [schemaUnionArrayName]: schemaUnionArray,
});

export default effect;
export {
  noDateNowInEffect,
  noDateNowInEffectName,
  noItEffectScoped,
  noItEffectScopedName,
  noPipeOnEffectFn,
  noPipeOnEffectFnName,
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
  preferDateFromString,
  preferDateFromStringName,
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
  requireReturnYieldOnFail,
  requireReturnYieldOnFailName,
  requireServiceIdPath,
  requireServiceIdPathName,
  requireServiceStaticLayer,
  requireServiceStaticLayerName,
  schemaNoLegacyFilter,
  schemaNoLegacyFilterName,
  schemaUnionArray,
  schemaUnionArrayName,
};
