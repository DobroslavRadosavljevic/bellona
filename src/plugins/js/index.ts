import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  noChainedTypeAssertions,
  noChainedTypeAssertionsName,
} from './rules/no-chained-type-assertions.ts';
import { noGenericModuleNames, noGenericModuleNamesName } from './rules/no-generic-module-names.ts';
import { noInlineImportType, noInlineImportTypeName } from './rules/no-inline-import-type.ts';
import { noKnownValueWidening, noKnownValueWideningName } from './rules/no-known-value-widening.ts';
import { noModuleMocking, noModuleMockingName } from './rules/no-module-mocking.ts';
import {
  noObjectKeysAssertion,
  noObjectKeysAssertionName,
} from './rules/no-object-keys-assertion.ts';
import { noObjectParameters, noObjectParametersName } from './rules/no-object-parameters.ts';
import { noRuntimeTypeof, noRuntimeTypeofName } from './rules/no-runtime-typeof.ts';
import { forbiddenTermInNames, forbiddenTermInNamesId } from './rules/no-shape-in-symbol-names.ts';
import { noUnknownParameters, noUnknownParametersName } from './rules/no-unknown-parameters.ts';
import { noUnknownReturns, noUnknownReturnsName } from './rules/no-unknown-returns.ts';
import { noUnknownTypeAliases, noUnknownTypeAliasesName } from './rules/no-unknown-type-aliases.ts';
import {
  noUnsafeDictionaryType,
  noUnsafeDictionaryTypeName,
} from './rules/no-unsafe-dictionary-type.ts';
import { noUntypedJson, noUntypedJsonName } from './rules/no-untyped-json.ts';
import { noUselessReexport, noUselessReexportName } from './rules/no-useless-reexport.ts';
import { noWidenThenAssert, noWidenThenAssertName } from './rules/no-widen-then-assert.ts';
import { requireFileLayout, requireFileLayoutName } from './rules/require-file-layout.ts';
import { requireOwnKeyLookup, requireOwnKeyLookupName } from './rules/require-own-key-lookup.ts';
import {
  requireSafetyCommentForTypeAssertion,
  requireSafetyCommentForTypeAssertionName,
} from './rules/require-safety-comment-for-type-assertion.ts';

const js = defineBellonaPlugin('bl-js', {
  [noChainedTypeAssertionsName]: noChainedTypeAssertions,
  [noGenericModuleNamesName]: noGenericModuleNames,
  [noInlineImportTypeName]: noInlineImportType,
  [noKnownValueWideningName]: noKnownValueWidening,
  [noModuleMockingName]: noModuleMocking,
  [noObjectKeysAssertionName]: noObjectKeysAssertion,
  [noObjectParametersName]: noObjectParameters,
  [noRuntimeTypeofName]: noRuntimeTypeof,
  [forbiddenTermInNamesId]: forbiddenTermInNames,
  [noUnknownParametersName]: noUnknownParameters,
  [noUnknownReturnsName]: noUnknownReturns,
  [noUnknownTypeAliasesName]: noUnknownTypeAliases,
  [noUnsafeDictionaryTypeName]: noUnsafeDictionaryType,
  [noUntypedJsonName]: noUntypedJson,
  [noUselessReexportName]: noUselessReexport,
  [noWidenThenAssertName]: noWidenThenAssert,
  [requireFileLayoutName]: requireFileLayout,
  [requireOwnKeyLookupName]: requireOwnKeyLookup,
  [requireSafetyCommentForTypeAssertionName]: requireSafetyCommentForTypeAssertion,
});

export default js;
export {
  noChainedTypeAssertions,
  noChainedTypeAssertionsName,
  noGenericModuleNames,
  noGenericModuleNamesName,
  noInlineImportType,
  noInlineImportTypeName,
  noKnownValueWidening,
  noKnownValueWideningName,
  noModuleMocking,
  noModuleMockingName,
  noObjectKeysAssertion,
  noObjectKeysAssertionName,
  noObjectParameters,
  noObjectParametersName,
  noRuntimeTypeof,
  noRuntimeTypeofName,
  forbiddenTermInNames,
  forbiddenTermInNamesId,
  noUnknownParameters,
  noUnknownParametersName,
  noUnknownReturns,
  noUnknownReturnsName,
  noUnknownTypeAliases,
  noUnknownTypeAliasesName,
  noUnsafeDictionaryType,
  noUnsafeDictionaryTypeName,
  noUntypedJson,
  noUntypedJsonName,
  noUselessReexport,
  noUselessReexportName,
  noWidenThenAssert,
  noWidenThenAssertName,
  requireFileLayout,
  requireFileLayoutName,
  requireOwnKeyLookup,
  requireOwnKeyLookupName,
  requireSafetyCommentForTypeAssertion,
  requireSafetyCommentForTypeAssertionName,
};
