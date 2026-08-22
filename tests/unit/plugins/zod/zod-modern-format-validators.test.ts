import { zodModernFormatValidatorsName } from '../../../../src/plugins/zod/rules/zod-modern-format-validators.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runZodRule } from './harness.ts';

runZodRule(zodModernFormatValidatorsName, {
  valid: [
    { code: 'const s = z.email();' },
    { code: 'const s = z.string().min(1);' },
    { code: 'const s = other.string().email();' },
    validWith('const s = z.string().email();', { filename: 'schema.test.ts' }),
  ],
  invalid: [
    invalidWith({
      code: 'const s = z.string().email();',
      errors: [{ messageId: 'preferTopLevel', data: { method: 'email' } }],
    }),
    invalidWith({
      code: 'const s = z.string().url();',
      errors: [{ messageId: 'preferTopLevel', data: { method: 'url' } }],
    }),
    invalidWith({
      code: 'const s = z.string().uuid();',
      errors: [{ messageId: 'preferTopLevel', data: { method: 'uuid' } }],
    }),
  ],
});
