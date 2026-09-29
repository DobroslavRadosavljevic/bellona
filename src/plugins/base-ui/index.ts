import { defineBellonaPlugin } from '../../lib/plugin.ts';
import { noComponentAsRender, noComponentAsRenderName } from './rules/no-component-as-render.ts';
import {
  requireNativeButtonWithRender,
  requireNativeButtonWithRenderName,
} from './rules/require-native-button-with-render.ts';

const baseUi = defineBellonaPlugin('bl-base-ui', {
  [noComponentAsRenderName]: noComponentAsRender,
  [requireNativeButtonWithRenderName]: requireNativeButtonWithRender,
});

export default baseUi;
export {
  noComponentAsRender,
  noComponentAsRenderName,
  requireNativeButtonWithRender,
  requireNativeButtonWithRenderName,
};
