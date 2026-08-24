import { defineBellonaPlugin } from '../../lib/plugin.ts';
import {
  requireNativeButtonWithRender,
  requireNativeButtonWithRenderName,
} from './rules/require-native-button-with-render.ts';

const baseUi = defineBellonaPlugin('bl-base-ui', {
  [requireNativeButtonWithRenderName]: requireNativeButtonWithRender,
});

export default baseUi;
export { requireNativeButtonWithRender, requireNativeButtonWithRenderName };
