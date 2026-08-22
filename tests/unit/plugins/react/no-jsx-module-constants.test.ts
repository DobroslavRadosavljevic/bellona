import { noJsxModuleConstantsName } from '../../../../src/plugins/react/rules/no-jsx-module-constants.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noJsxModuleConstantsName, {
  valid: [
    validWith('export function Icon() { return <span />; }', { filename: 'icon.tsx' }),
    validWith('const label = "hi";', { filename: 'icon.tsx' }),
  ],
  invalid: [
    invalidWith({
      filename: 'icon.tsx',
      code: 'const icon = <span />;',
      errors: [error('moduleConst')],
    }),
  ],
});
