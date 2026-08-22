import { zodSchemaNamingName } from '../../../../src/plugins/zod/rules/zod-schema-naming.ts';
import { error, invalidWith } from '../../lib/cases.ts';
import { runZodRule } from './harness.ts';

runZodRule(zodSchemaNamingName, {
  valid: [
    { code: 'export const UserSchema = z.object({ id: z.string() });' },
    { code: 'const userSchema = z.object({ id: z.string() });' },
    { code: 'export const count = 1;' },
    { code: 'export const UserInput = UserSchema.pick({ id: true });' },
    { code: 'export const Extended = UserSchema.extend({ name: z.string() });' },
    { code: 'export const makeUserSchema = () => z.object({});' },
  ],
  invalid: [
    invalidWith({
      code: 'export const userSchema = z.object({ id: z.string() });',
      errors: [error('naming')],
    }),
    invalidWith({
      code: 'export const user = z.object({}).strict();',
      errors: [error('naming')],
    }),
  ],
});
