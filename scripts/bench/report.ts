import type { BenchRule } from './catalog.ts';

export type BenchRuleResult = {
  readonly ruleId: string;
  readonly pluginId: string;
  readonly milliseconds: number;
  readonly netMilliseconds: number;
};

export type BenchReport = {
  readonly baselineMilliseconds: number;
  readonly allEnabledMilliseconds: number;
  readonly files: number;
  readonly bytes: number;
  readonly rules: readonly BenchRuleResult[];
};

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(3)}s`;
}

export function toBenchReport(
  baselineMilliseconds: number,
  allEnabledMilliseconds: number,
  files: number,
  bytes: number,
  timed: readonly { readonly rule: BenchRule; readonly milliseconds: number }[],
): BenchReport {
  const rules = timed.map((entry) => ({
    ruleId: entry.rule.ruleId,
    pluginId: entry.rule.pluginId,
    milliseconds: entry.milliseconds,
    netMilliseconds: Math.max(0, entry.milliseconds - baselineMilliseconds),
  }));
  const ranked = rules.slice();
  ranked.sort((left, right) => right.netMilliseconds - left.netMilliseconds);
  return {
    baselineMilliseconds,
    allEnabledMilliseconds,
    files,
    bytes,
    rules: ranked,
  };
}

export function formatBenchTable(report: BenchReport): string {
  const lines = [
    `Corpus: ${String(report.files)} files, ${String(report.bytes)} bytes`,
    `Baseline (plugins on, rules off): ${formatSeconds(report.baselineMilliseconds)}`,
    `All selected rules on: ${formatSeconds(report.allEnabledMilliseconds)}`,
    '',
    'net      total    rule',
    '------   ------   ----',
  ];
  for (const rule of report.rules) {
    const net = formatSeconds(rule.netMilliseconds).padStart(8, ' ');
    const total = formatSeconds(rule.milliseconds).padStart(8, ' ');
    lines.push(`${net} ${total}   ${rule.ruleId}`);
  }
  return `${lines.join('\n')}\n`;
}
