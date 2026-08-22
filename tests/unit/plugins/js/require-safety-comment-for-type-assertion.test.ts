import { requireSafetyCommentForTypeAssertionName } from '../../../../src/plugins/js/rules/require-safety-comment-for-type-assertion.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'missingSafetyComment' };

runJsRule(requireSafetyCommentForTypeAssertionName, {
  valid: [
    'const values = [1, 2] as const;',
    "const value = <const>{ id: 'one' };",
    '// SAFETY: The parser established the UserId invariant.\nconst id = value as UserId;',
    'function parse(): UserId {\n// SAFETY: Validation above established the UserId invariant.\nreturn value as UserId;\n}',
    'const id = /* SAFETY: Validation established the invariant. */ value as UserId;',
    {
      code: '// INVARIANT: The parser established the UserId invariant.\nconst id = value as UserId;',
      options: [{ marker: 'INVARIANT' }],
    },
  ],
  invalid: [
    { code: 'const id = value as UserId;', errors: [error] },
    { code: 'const id = <UserId>value;', errors: [error] },
    { code: 'const id = value as UserId; // SAFETY: Too late.', errors: [error] },
    {
      code: '// This cast seems fine.\nconst id = value as UserId;',
      errors: [error],
    },
    {
      code: '// SAFETY: Wrong marker.\nconst id = value as UserId;',
      options: [{ marker: 'INVARIANT' }],
      errors: [error],
    },
  ],
});
