import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  zodModernFormatValidators,
  zodModernFormatValidatorsName,
} from './rules/zod-modern-format-validators.ts';
import { zodSchemaNaming, zodSchemaNamingName } from './rules/zod-schema-naming.ts';

const zod = defineBellonaPlugin('zod', {
  [zodModernFormatValidatorsName]: zodModernFormatValidators,
  [zodSchemaNamingName]: zodSchemaNaming,
});

export default zod;
export {
  zodModernFormatValidators,
  zodModernFormatValidatorsName,
  zodSchemaNaming,
  zodSchemaNamingName,
};
