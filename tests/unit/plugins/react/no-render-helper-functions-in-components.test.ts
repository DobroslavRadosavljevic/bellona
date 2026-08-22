import { noRenderHelperFunctionsInComponentsName } from '../../../../src/plugins/react/rules/no-render-helper-functions-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noRenderHelperFunctionsInComponentsName, {
  valid: [
    validWith('function Card() { return <div />; }', { filename: 'card.tsx' }),
    validWith('const Card = () => <div />;', { filename: 'card.tsx' }),
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
  ],
});
