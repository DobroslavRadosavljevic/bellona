import { describe, expect, it } from 'vitest';

import { agentDiagnostic } from '../../../src/lib/lint-message.ts';

describe('agentDiagnostic', () => {
  it('joins Problem, Why, Fix, and Do not lines', () => {
    expect(
      agentDiagnostic({
        problem: 'Found {{name}}.',
        why: 'It breaks the contract.',
        fix: 'Replace it with the owner type.',
        avoid: 'Do not disable the rule.',
      }),
    ).toBe(
      [
        'Problem: Found {{name}}.',
        'Why: It breaks the contract.',
        'Fix: Replace it with the owner type.',
        'Avoid: Do not disable the rule.',
      ].join('\n'),
    );
  });
});
