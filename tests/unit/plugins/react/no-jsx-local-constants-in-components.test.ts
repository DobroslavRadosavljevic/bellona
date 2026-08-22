import { noJsxLocalConstantsInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-local-constants-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxLocalConstantsInComponentsName, {
  valid: [
    validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' }),
    validWith('function helper() { const x = <span />; return x; }', { filename: 'card.tsx' }),
  ],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { const icon = <span />; return icon; }',
      errors: [error('localConst')],
    }),
  ],
});
