import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { noClassnameConstants, noClassnameConstantsName } from './rules/no-classname-constants.ts';

const tailwind = defineBellonaPlugin('bl-tailwind', {
  [noClassnameConstantsName]: noClassnameConstants,
});

export default tailwind;
export { noClassnameConstants, noClassnameConstantsName };
