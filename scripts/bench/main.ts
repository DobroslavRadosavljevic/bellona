import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { filterBenchRules, listBenchPlugins, listBenchRules, type BenchRule } from './catalog.ts';
import { buildCorpusFiles, corpusStats, type CorpusStats } from './corpus.ts';
import { BENCH_USAGE, parseBenchArgs } from './options.ts';
import { formatBenchTable, toBenchReport } from './report.ts';

function repoRootFromHere(here: string): string {
  return join(here, '..', '..');
}

function posixRelative(from: string, to: string): string {
  return relative(from, to).split('\\').join('/');
}

function writeCorpus(corpusDir: string, scale: number): CorpusStats {
  const files = buildCorpusFiles(scale);
  for (const file of files) {
    const fullPath = join(corpusDir, file.relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content);
  }
  return corpusStats(files);
}

function oxlintConfigSource(
  configDir: string,
  repoRoot: string,
  enabledRuleIds: readonly string[],
): string {
  const specifiers = listBenchPlugins().map((plugin) => {
    const absolute = join(repoRoot, plugin.sourcePath);
    return posixRelative(configDir, absolute);
  });
  const specifierList = specifiers.map((specifier) => `    '${specifier}',`).join('\n');
  const ruleEntries = enabledRuleIds.map((ruleId) => `    '${ruleId}': 'error',`).join('\n');
  return `import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
    suspicious: 'off',
  },
  plugins: [],
  jsPlugins: [
${specifierList}
  ],
  rules: {
${ruleEntries}
  },
});
`;
}

function writeConfig(
  configDir: string,
  repoRoot: string,
  fileName: string,
  enabledRuleIds: readonly string[],
): string {
  mkdirSync(configDir, { recursive: true });
  const configPath = join(configDir, fileName);
  writeFileSync(configPath, oxlintConfigSource(configDir, repoRoot, enabledRuleIds));
  return configPath;
}

type TimedRule = {
  readonly rule: BenchRule;
  readonly milliseconds: number;
};

function timeOxlint(repoRoot: string, configPath: string, corpusDir: string): number {
  const started = performance.now();
  spawnSync(
    'bunx',
    ['oxlint', '--disable-nested-config', '--silent', '-c', configPath, corpusDir],
    { cwd: repoRoot, stdio: 'ignore' },
  );
  return performance.now() - started;
}

function median(values: readonly number[]): number {
  const copy = values.slice();
  copy.sort((left, right) => left - right);
  const middle = copy[Math.floor((copy.length - 1) / 2)];
  return middle ?? 0;
}

function timeWithRepeat(
  repoRoot: string,
  configPath: string,
  corpusDir: string,
  repeat: number,
): number {
  const samples: number[] = [];
  for (let index = 0; index < repeat; index += 1) {
    samples.push(timeOxlint(repoRoot, configPath, corpusDir));
  }
  return median(samples);
}

function main(): void {
  const options = parseBenchArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(BENCH_USAGE);
    return;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = repoRootFromHere(here);
  const benchDir = join(repoRoot, '.temp', 'bench');
  const corpusDir = join(benchDir, 'corpus');
  const configDir = join(benchDir, 'configs');

  rmSync(benchDir, { recursive: true, force: true });
  mkdirSync(corpusDir, { recursive: true });
  const stats = writeCorpus(corpusDir, options.scale);

  const selected = filterBenchRules(listBenchRules(options.pluginIds), options.ruleFilters);
  if (selected.length === 0) {
    process.stderr.write('No rules matched. Check --plugin and --rule.\n');
    process.exitCode = 1;
    return;
  }

  const baselineConfig = writeConfig(configDir, repoRoot, 'baseline.ts', []);
  timeOxlint(repoRoot, baselineConfig, corpusDir);
  const baselineMilliseconds = timeWithRepeat(repoRoot, baselineConfig, corpusDir, options.repeat);

  const timed: TimedRule[] = [];
  for (const rule of selected) {
    const configPath = writeConfig(configDir, repoRoot, `${rule.metaName}.${rule.ruleName}.ts`, [
      rule.ruleId,
    ]);
    timed.push({
      rule,
      milliseconds: timeWithRepeat(repoRoot, configPath, corpusDir, options.repeat),
    });
  }

  const allConfig = writeConfig(
    configDir,
    repoRoot,
    'all-selected.ts',
    selected.map((rule) => rule.ruleId),
  );
  const allEnabledMilliseconds = timeWithRepeat(repoRoot, allConfig, corpusDir, options.repeat);

  const report = toBenchReport(
    baselineMilliseconds,
    allEnabledMilliseconds,
    stats.files,
    stats.bytes,
    timed,
  );

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatBenchTable(report));
  }

  if (!options.keep) {
    rmSync(benchDir, { recursive: true, force: true });
  }
}

main();
