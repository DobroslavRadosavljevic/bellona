import { noJsxIifeInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-iife-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxIifeInComponentsName, {
  valid: [validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' })],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  const node = (() => <A />)();\n  return node;\n}',
      errors: [error('iife')],
    }),
  ],
});
