export type BenchOptions = {
  readonly pluginIds: readonly string[];
  readonly ruleFilters: readonly string[];
  readonly scale: number;
  readonly repeat: number;
  readonly keep: boolean;
  readonly json: boolean;
  readonly help: boolean;
};

const DEFAULT_SCALE = 8;
const DEFAULT_REPEAT = 1;

function readFlagValue(
  argv: readonly string[],
  index: number,
): { readonly value: string; readonly next: number } | null {
  const current = argv[index];
  if (current === undefined) {
    return null;
  }
  const equals = current.indexOf('=');
  if (equals >= 0) {
    return { value: current.slice(equals + 1), next: index };
  }
  const nextValue = argv[index + 1];
  if (nextValue === undefined || nextValue.startsWith('--')) {
    return null;
  }
  return { value: nextValue, next: index + 1 };
}

function parsePositiveInt(raw: string, fallback: number): number {
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const BENCH_USAGE = `Usage: bun run bench [--plugin <id>] [--rule <id>] [--scale N] [--repeat N] [--keep] [--json]

Times every Bellona rule on one mixed corpus. Default: all plugins, scale 8, one run each.

  --plugin js          Repeat to limit plugins (js, react, effect, elysia, tanstack-router, zod, tailwind, base-ui)
  --rule bl-js/max-classes   Repeat to limit rules (full id, slug, or plugin/slug)
  --scale 8            Files per domain in the corpus
  --repeat 1           Runs per rule; report the median
  --keep               Keep .temp/bench after the run
  --json               Print JSON instead of a table
`;

export function parseBenchArgs(argv: readonly string[]): BenchOptions {
  const pluginIds: string[] = [];
  const ruleFilters: string[] = [];
  let scale = DEFAULT_SCALE;
  let repeat = DEFAULT_REPEAT;
  let keep = false;
  let json = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) {
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (arg === '--keep') {
      keep = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--plugin' || arg.startsWith('--plugin=')) {
      const parsed = readFlagValue(argv, index);
      if (parsed !== null) {
        pluginIds.push(parsed.value);
        index = parsed.next;
      }
      continue;
    }
    if (arg === '--rule' || arg.startsWith('--rule=')) {
      const parsed = readFlagValue(argv, index);
      if (parsed !== null) {
        ruleFilters.push(parsed.value);
        index = parsed.next;
      }
      continue;
    }
    if (arg === '--scale' || arg.startsWith('--scale=')) {
      const parsed = readFlagValue(argv, index);
      if (parsed !== null) {
        scale = parsePositiveInt(parsed.value, DEFAULT_SCALE);
        index = parsed.next;
      }
      continue;
    }
    if (arg === '--repeat' || arg.startsWith('--repeat=')) {
      const parsed = readFlagValue(argv, index);
      if (parsed !== null) {
        repeat = parsePositiveInt(parsed.value, DEFAULT_REPEAT);
        index = parsed.next;
      }
    }
  }

  return { pluginIds, ruleFilters, scale, repeat, keep, json, help };
}
