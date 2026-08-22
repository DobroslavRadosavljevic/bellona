import { noJsxIifeInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-iife-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxIifeInComponentsName, {
  valid: [
    validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' }),
    validWith('function Card() { return flag && <A />; }', { filename: 'card.tsx' }),
    validWith('function helper() { const node = (() => <A />)(); return node; }', {
      filename: 'card.tsx',
    }),
    validWith('function Card() { const value = (() => 1)(); return <div>{value}</div>; }', {
      filename: 'card.tsx',
    }),
    validWith('function Card() { return <A />; }', { filename: 'card.test.tsx' }),
    validWith('function Card() { const node = (() => <A />)(); return node; }', {
      filename: 'card.tsx',
      options: [{ allow: ['card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  const node = (() => <A />)();\n  return node;\n}',
      errors: [error('iife')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  const node = (function () { return <A />; })();\n  return node;\n}',
      errors: [error('iife')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = () => {\n  return ((() => <A />)());\n};',
      errors: [error('iife')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { return <div>{(() => <span />)()}</div>; }',
      errors: [error('iife')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = memo(() => {\n  const node = (() => <A />)();\n  return node;\n});',
      errors: [error('iife')],
    }),
  ],
});
