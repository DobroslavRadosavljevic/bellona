import { noJsxLocalConstantsInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-local-constants-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxLocalConstantsInComponentsName, {
  valid: [
    validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' }),
    validWith('function helper() { const x = <span />; return x; }', { filename: 'card.tsx' }),
    validWith('function Card() { let node = <span />; return node; }', { filename: 'card.tsx' }),
    validWith('function Card() { const label = "hi"; return <span>{label}</span>; }', {
      filename: 'card.tsx',
    }),
    validWith('const icon = <span />;', { filename: 'card.tsx' }),
    validWith('function Card() { const icon = <span />; return icon; }', {
      filename: 'card.test.tsx',
    }),
    validWith('function Card() { const icon = <span />; return icon; }', {
      filename: 'card.tsx',
      options: [{ allow: ['card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = <span />; return icon; }',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = flag && <span />; return icon; }',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = flag ? <A /> : <B />; return icon; }',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = (<span />); return icon; }',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = <span /> as const; return icon; }',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = memo(() => { const icon = <span />; return icon; });',
      errors: [error('localConst')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const rows = items.map((item) => <li key={item} />); return <ul>{rows}</ul>; }',
      errors: [error('localConst')],
    }),
  ],
});
