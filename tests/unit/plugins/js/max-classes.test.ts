import { maxClassesName } from '../../../../src/plugins/js/rules/max-classes.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { classDeclarations, classExpressions } from './fixtures.ts';
import { runJsRule } from './harness.ts';

runJsRule(maxClassesName, {
  valid: [
    classDeclarations(1),
    classDeclarations(5),
    validWith(classDeclarations(2), { options: [{ max: 2 }] }),
    classExpressions(6),
  ],
  invalid: [
    invalidWith({
      name: 'the sixth declaration',
      code: classDeclarations(6),
      errors: [{ messageId: 'maxClasses', line: 1, column: 55, endColumn: 65 }],
    }),
    invalidWith({
      name: 'custom max',
      code: classDeclarations(2),
      options: [{ max: 1 }],
      errors: [error('maxClasses')],
    }),
  ],
});
