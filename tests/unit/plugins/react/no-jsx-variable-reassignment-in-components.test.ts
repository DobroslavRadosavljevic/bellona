import { noJsxVariableReassignmentInComponentsName } from '../../../../src/plugins/react/rules/no-jsx-variable-reassignment-in-components.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxVariableReassignmentInComponentsName, {
  valid: [
    validWith('function Card() { return flag ? <A /> : <B />; }', { filename: 'card.tsx' }),
    validWith(
      'function helper() {\n  let node = null;\n  if (flag) node = <A />;\n  return node;\n}',
      {
        filename: 'card.tsx',
      },
    ),
    validWith('function Card() { let count = 0; count = 1; return <div>{count}</div>; }', {
      filename: 'card.tsx',
    }),
    validWith('function Card() { bag.node = <A />; return bag.node; }', { filename: 'card.tsx' }),
    validWith(
      'function Card() {\n  let node = null;\n  if (flag) node = <A />;\n  return node;\n}',
      {
        filename: 'card.test.tsx',
      },
    ),
  ],
  invalid: [
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  let node = null;\n  if (flag) node = <A />;\n  return node;\n}',
      errors: [error('reassign')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() {\n  let node = name;\n  if (flag) node = <del>{name}</del>;\n  return <li>{node}</li>;\n}',
      errors: [error('reassign')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'function Card() { let node; node = flag ? <A /> : <B />; return node; }',
      errors: [error('reassign')],
    }),
    invalidWith({
      filename: 'card.tsx',
      code: 'const Card = memo(() => { let node = null; node = <A />; return node; });',
      errors: [error('reassign')],
    }),
  ],
});
