import { noJsxModuleConstantsName } from '../../../../src/plugins/react/rules/no-jsx-module-constants.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxModuleConstantsName, {
  valid: [
    validWith('export function Icon() { return <span />; }', { filename: 'icon.tsx' }),
    validWith('const label = "hi";', { filename: 'icon.tsx' }),
    validWith('function Icon() { const local = <span />; return local; }', {
      filename: 'icon.tsx',
    }),
    validWith('const Icon = () => <span />;', { filename: 'icon.tsx' }),
    validWith('const icon = <span />;', { filename: 'icon.test.tsx' }),
    validWith('const icon = <span />;', {
      filename: 'icon.tsx',
      options: [{ allow: ['icon.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'icon.tsx',
      code: 'const icon = <span />;',
      errors: [error('moduleConst')],
    }),
    invalidWith({
      filename: 'icon.tsx',
      code: 'const icon = flag ? <A /> : <B />;',
      errors: [error('moduleConst')],
    }),
    invalidWith({
      filename: 'icon.tsx',
      code: 'const icon = (<span />) as const;',
      errors: [error('moduleConst')],
    }),
    invalidWith({
      filename: 'icon.tsx',
      code: 'export const rows = items.map((item) => <li key={item} />);',
      errors: [error('moduleConst')],
    }),
    invalidWith({
      filename: 'icon.tsx',
      code: 'const empty = <></>;',
      errors: [error('moduleConst')],
    }),
  ],
});
