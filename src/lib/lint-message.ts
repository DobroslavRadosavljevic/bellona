/**
 * Build a lint diagnostic for an agent. Keep `{{placeholders}}` in the
 * strings so Oxlint can fill them at report time.
 *
 * Do not write JSX examples such as `params={{ postId }}`. Oxlint treats
 * every `{{name}}` as a placeholder, including names that are only examples.
 */
export function agentDiagnostic(parts: {
  problem: string;
  why: string;
  fix: string;
  avoid: string;
}): string {
  return [
    `Problem: ${parts.problem}`,
    `Why: ${parts.why}`,
    `Fix: ${parts.fix}`,
    `Avoid: ${parts.avoid}`,
  ].join('\n');
}
