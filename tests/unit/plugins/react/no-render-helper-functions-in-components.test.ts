import { noRenderHelperFunctionsInComponentsName } from '../../../../src/plugins/react/rules/no-render-helper-functions-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noRenderHelperFunctionsInComponentsName, {
  valid: [
    validWith('function Card() { return <div />; }', { filename: 'card.tsx' }),
    validWith('const Card = () => <div />;', { filename: 'card.tsx' }),
    validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' }),
    validWith('function Card() { return flag && <A />; }', { filename: 'card.tsx' }),
    validWith('function Card() { return items.map((item) => <li key={item} />); }', {
      filename: 'card.tsx',
    }),
    validWith('const Card = memo(() => <div />);', { filename: 'card.tsx' }),
    validWith('const Card = React.memo(function Card() { return <div />; });', {
      filename: 'card.tsx',
    }),
    validWith('const Card = forwardRef((props, ref) => <div ref={ref} />);', {
      filename: 'card.tsx',
    }),
    validWith('export default function Card() { return <div />; }', { filename: 'card.tsx' }),
    validWith('function helper() { return 1; }', { filename: 'card.tsx' }),
    validWith('function Card() { function helper() { return 1; } return <div />; }', {
      filename: 'card.tsx',
    }),
    validWith('function Card() { return <div />; }', { filename: 'card.test.tsx' }),
    validWith('function renderBody() { return <div />; }', {
      filename: 'card.tsx',
      options: [{ allow: ['card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  function renderBody() { return <div />; }\n  return renderBody();\n}',
      errors: [error('insideComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderBody() { return <div />; }',
      errors: [error('nonComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = () => {\n  const renderBody = () => <span />;\n  return renderBody();\n};',
      errors: [error('insideComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = memo(() => {\n  function renderBody() { return <div />; }\n  return renderBody();\n});',
      errors: [error('insideComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderRows() { return items.map((item) => <li key={item} />); }',
      errors: [error('nonComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderMaybe() { return flag && <span />; }',
      errors: [error('nonComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderChoice() { return flag ? <A /> : <B />; }',
      errors: [error('nonComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderPair() { return [<A />, <B />]; }',
      errors: [error('nonComponent')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function renderCast() { return (<div />) as const; }',
      errors: [error('nonComponent')],
    }),
  ],
});
