import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { exhaustiveDeps, exhaustiveDepsName } from './rules/exhaustive-deps.ts';
import {
  noDeprecatedClientMethods,
  noDeprecatedClientMethodsName,
} from './rules/no-deprecated-client-methods.ts';
import { noDeprecatedImports, noDeprecatedImportsName } from './rules/no-deprecated-imports.ts';
import {
  noDeprecatedQueryContext,
  noDeprecatedQueryContextName,
} from './rules/no-deprecated-query-context.ts';
import { noDeprecatedResults, noDeprecatedResultsName } from './rules/no-deprecated-results.ts';
import { noRemovedOptions, noRemovedOptionsName } from './rules/no-removed-options.ts';
import { noRestDestructuring, noRestDestructuringName } from './rules/no-rest-destructuring.ts';
import { noUnstableDeps, noUnstableDepsName } from './rules/no-unstable-deps.ts';
import { stableQueryClient, stableQueryClientName } from './rules/stable-query-client.ts';

const tanstackQuery = defineBellonaPlugin('bl-tanstack-query', {
  [exhaustiveDepsName]: exhaustiveDeps,
  [noDeprecatedClientMethodsName]: noDeprecatedClientMethods,
  [noDeprecatedImportsName]: noDeprecatedImports,
  [noDeprecatedQueryContextName]: noDeprecatedQueryContext,
  [noDeprecatedResultsName]: noDeprecatedResults,
  [noRemovedOptionsName]: noRemovedOptions,
  [noRestDestructuringName]: noRestDestructuring,
  [noUnstableDepsName]: noUnstableDeps,
  [stableQueryClientName]: stableQueryClient,
});

export default tanstackQuery;
export {
  exhaustiveDeps,
  exhaustiveDepsName,
  noDeprecatedClientMethods,
  noDeprecatedClientMethodsName,
  noDeprecatedImports,
  noDeprecatedImportsName,
  noDeprecatedQueryContext,
  noDeprecatedQueryContextName,
  noDeprecatedResults,
  noDeprecatedResultsName,
  noRemovedOptions,
  noRemovedOptionsName,
  noRestDestructuring,
  noRestDestructuringName,
  noUnstableDeps,
  noUnstableDepsName,
  stableQueryClient,
  stableQueryClientName,
};
