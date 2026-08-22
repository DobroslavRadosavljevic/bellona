import { noShapeInSymbolNamesName } from '../../../../src/plugins/js/rules/no-shape-in-symbol-names.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const forbidden = error('forbiddenSymbolName');

runJsRule(noShapeInSymbolNamesName, {
  valid: [
    validWith('const user = { id: "one" };', { name: 'plain identifier' }),
    validWith('interface User { readonly id: string }', { name: 'interface without term' }),
    validWith('function saveUser(user: User) {}', { name: 'function without term' }),
    validWith('class UserStore {}', { name: 'class without term' }),
    validWith('const userShape = 1;', {
      name: 'custom term allows shape',
      options: [{ term: 'dto' }],
    }),
    validWith('const ShapeOfUser = 1;', {
      name: 'case-sensitive miss',
      options: [{ caseSensitive: true }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'const binding',
      code: 'const userShape = 1;',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'interface name',
      code: 'interface UserShape { readonly id: string }',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'function name',
      code: 'function toShape(value: User) {}',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'class name',
      code: 'class UserShape {}',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'case-insensitive match',
      code: 'const ShapeOfUser = 1;',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'custom term',
      code: 'const userDto = 1;',
      options: [{ term: 'dto' }],
      errors: [forbidden],
    }),
  ],
});
