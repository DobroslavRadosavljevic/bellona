import { noJsxVariableReassignmentInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-variable-reassignment-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxVariableReassignmentInComponentsName, {
  valid: [validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' })],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  let node = null;\n  if (flag) node = <A />;\n  return node;\n}',
      errors: [error('reassign')],
    }),
  ],
});
