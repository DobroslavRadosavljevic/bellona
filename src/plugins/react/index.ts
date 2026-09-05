import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  componentFileNameMatch,
  componentFileNameMatchName,
} from './rules/component-file-name-match.ts';
import { componentPropsType, componentPropsTypeName } from './rules/component-props-type.ts';
import { hookFileNameMatch, hookFileNameMatchName } from './rules/hook-file-name-match.ts';
import {
  noImplComponentSuffix,
  noImplComponentSuffixName,
} from './rules/no-impl-component-suffix.ts';
import {
  noJsxIifeInComponents,
  noJsxIifeInComponentsName,
} from './rules/no-jsx-iife-in-components.ts';
import {
  noJsxLocalConstantsInComponents,
  noJsxLocalConstantsInComponentsName,
} from './rules/no-jsx-local-constants-in-components.ts';
import { noJsxModuleConstants, noJsxModuleConstantsName } from './rules/no-jsx-module-constants.ts';
import {
  noJsxVariableReassignmentInComponents,
  noJsxVariableReassignmentInComponentsName,
} from './rules/no-jsx-variable-reassignment-in-components.ts';
import {
  noMultiComponentFiles,
  noMultiComponentFilesName,
} from './rules/no-multi-component-files.ts';
import { noMultiHookFiles, noMultiHookFilesName } from './rules/no-multi-hook-files.ts';
import { noNativeHtml, noNativeHtmlName } from './rules/no-native-html.ts';
import { noReactNamespace, noReactNamespaceName } from './rules/no-react-namespace.ts';
import {
  noRenderHelperFunctionsInComponents,
  noRenderHelperFunctionsInComponentsName,
} from './rules/no-render-helper-functions-in-components.ts';

const react = defineBellonaPlugin('bl-react', {
  [componentFileNameMatchName]: componentFileNameMatch,
  [componentPropsTypeName]: componentPropsType,
  [hookFileNameMatchName]: hookFileNameMatch,
  [noImplComponentSuffixName]: noImplComponentSuffix,
  [noJsxIifeInComponentsName]: noJsxIifeInComponents,
  [noJsxLocalConstantsInComponentsName]: noJsxLocalConstantsInComponents,
  [noJsxModuleConstantsName]: noJsxModuleConstants,
  [noJsxVariableReassignmentInComponentsName]: noJsxVariableReassignmentInComponents,
  [noMultiComponentFilesName]: noMultiComponentFiles,
  [noMultiHookFilesName]: noMultiHookFiles,
  [noNativeHtmlName]: noNativeHtml,
  [noReactNamespaceName]: noReactNamespace,
  [noRenderHelperFunctionsInComponentsName]: noRenderHelperFunctionsInComponents,
});

export default react;
export {
  componentFileNameMatch,
  componentFileNameMatchName,
  componentPropsType,
  componentPropsTypeName,
  hookFileNameMatch,
  hookFileNameMatchName,
  noImplComponentSuffix,
  noImplComponentSuffixName,
  noJsxIifeInComponents,
  noJsxIifeInComponentsName,
  noJsxLocalConstantsInComponents,
  noJsxLocalConstantsInComponentsName,
  noJsxModuleConstants,
  noJsxModuleConstantsName,
  noJsxVariableReassignmentInComponents,
  noJsxVariableReassignmentInComponentsName,
  noMultiComponentFiles,
  noMultiComponentFilesName,
  noMultiHookFiles,
  noMultiHookFilesName,
  noNativeHtml,
  noNativeHtmlName,
  noReactNamespace,
  noReactNamespaceName,
  noRenderHelperFunctionsInComponents,
  noRenderHelperFunctionsInComponentsName,
};
