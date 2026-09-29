import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { noClassnameConstants, noClassnameConstantsName } from './rules/no-classname-constants.ts';
import {
  noDynamicClassConstruction,
  noDynamicClassConstructionName,
} from './rules/no-dynamic-class-construction.ts';
import { noV3ArbitraryVar, noV3ArbitraryVarName } from './rules/no-v3-arbitrary-var.ts';

const tailwind = defineBellonaPlugin('bl-tailwind', {
  [noClassnameConstantsName]: noClassnameConstants,
  [noDynamicClassConstructionName]: noDynamicClassConstruction,
  [noV3ArbitraryVarName]: noV3ArbitraryVar,
});

export default tailwind;
export {
  noClassnameConstants,
  noClassnameConstantsName,
  noDynamicClassConstruction,
  noDynamicClassConstructionName,
  noV3ArbitraryVar,
  noV3ArbitraryVarName,
};
