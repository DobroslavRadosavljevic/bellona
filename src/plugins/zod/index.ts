import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  zodModernFormatValidators,
  zodModernFormatValidatorsName,
} from './rules/zod-modern-format-validators.ts';
import {
  zodNoDeprecatedV4Apis,
  zodNoDeprecatedV4ApisName,
} from './rules/zod-no-deprecated-v4-apis.ts';
import { zodSchemaNaming, zodSchemaNamingName } from './rules/zod-schema-naming.ts';

const zod = defineBellonaPlugin('bl-zod', {
  [zodModernFormatValidatorsName]: zodModernFormatValidators,
  [zodNoDeprecatedV4ApisName]: zodNoDeprecatedV4Apis,
  [zodSchemaNamingName]: zodSchemaNaming,
});

export default zod;
export {
  zodModernFormatValidators,
  zodModernFormatValidatorsName,
  zodNoDeprecatedV4Apis,
  zodNoDeprecatedV4ApisName,
  zodSchemaNaming,
  zodSchemaNamingName,
};
