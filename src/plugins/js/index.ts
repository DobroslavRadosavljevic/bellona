import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { maxClasses, maxClassesName } from './rules/max-classes.ts';
import {
  noChainedTypeAssertions,
  noChainedTypeAssertionsName,
} from './rules/no-chained-type-assertions.ts';
import {
  noConditionalEmptyObjectSpread,
  noConditionalEmptyObjectSpreadName,
} from './rules/no-conditional-empty-object-spread.ts';
import { noInlineImportType, noInlineImportTypeName } from './rules/no-inline-import-type.ts';
import { noKnownValueWidening, noKnownValueWideningName } from './rules/no-known-value-widening.ts';
import { noModuleMocking, noModuleMockingName } from './rules/no-module-mocking.ts';
import { noObjectParameters, noObjectParametersName } from './rules/no-object-parameters.ts';
import { noReflectApply, noReflectApplyName } from './rules/no-reflect-apply.ts';
import { noReflectGet, noReflectGetName } from './rules/no-reflect-get.ts';
import { noRuntimeTypeof, noRuntimeTypeofName } from './rules/no-runtime-typeof.ts';
import { forbiddenTermInNames, forbiddenTermInNamesId } from './rules/no-shape-in-symbol-names.ts';
import { noUnknownParameters, noUnknownParametersName } from './rules/no-unknown-parameters.ts';
import { noUnknownReturns, noUnknownReturnsName } from './rules/no-unknown-returns.ts';
import { noUnknownTypeAliases, noUnknownTypeAliasesName } from './rules/no-unknown-type-aliases.ts';
import {
  noUnsafeDictionaryType,
  noUnsafeDictionaryTypeName,
} from './rules/no-unsafe-dictionary-type.ts';
import { noUselessReexport, noUselessReexportName } from './rules/no-useless-reexport.ts';
import { noWidenThenAssert, noWidenThenAssertName } from './rules/no-widen-then-assert.ts';
import {
  requireSafetyCommentForTypeAssertion,
  requireSafetyCommentForTypeAssertionName,
} from './rules/require-safety-comment-for-type-assertion.ts';

const js = defineBellonaPlugin('bl-js', {
  [maxClassesName]: maxClasses,
  [noChainedTypeAssertionsName]: noChainedTypeAssertions,
  [noConditionalEmptyObjectSpreadName]: noConditionalEmptyObjectSpread,
  [noInlineImportTypeName]: noInlineImportType,
  [noKnownValueWideningName]: noKnownValueWidening,
  [noModuleMockingName]: noModuleMocking,
  [noObjectParametersName]: noObjectParameters,
  [noReflectApplyName]: noReflectApply,
  [noReflectGetName]: noReflectGet,
  [noRuntimeTypeofName]: noRuntimeTypeof,
  [forbiddenTermInNamesId]: forbiddenTermInNames,
  [noUnknownParametersName]: noUnknownParameters,
  [noUnknownReturnsName]: noUnknownReturns,
  [noUnknownTypeAliasesName]: noUnknownTypeAliases,
  [noUnsafeDictionaryTypeName]: noUnsafeDictionaryType,
  [noUselessReexportName]: noUselessReexport,
  [noWidenThenAssertName]: noWidenThenAssert,
  [requireSafetyCommentForTypeAssertionName]: requireSafetyCommentForTypeAssertion,
});

export default js;
export {
  maxClasses,
  maxClassesName,
  noChainedTypeAssertions,
  noChainedTypeAssertionsName,
  noConditionalEmptyObjectSpread,
  noConditionalEmptyObjectSpreadName,
  noInlineImportType,
  noInlineImportTypeName,
  noKnownValueWidening,
  noKnownValueWideningName,
  noModuleMocking,
  noModuleMockingName,
  noObjectParameters,
  noObjectParametersName,
  noReflectApply,
  noReflectApplyName,
  noReflectGet,
  noReflectGetName,
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
  noUselessReexport,
  noUselessReexportName,
  noWidenThenAssert,
  noWidenThenAssertName,
  requireSafetyCommentForTypeAssertion,
  requireSafetyCommentForTypeAssertionName,
};
