import { describe, expect, it } from 'vitest';

import { buildCorpusFiles, corpusStats } from '../../../scripts/bench/corpus.ts';
import { parseBenchArgs } from '../../../scripts/bench/options.ts';
import { toBenchReport } from '../../../scripts/bench/report.ts';

describe('bench options', () => {
  it('reads repeated plugin and rule flags', () => {
    const options = parseBenchArgs([
      '--plugin',
      'js',
      '--plugin=react',
      '--rule',
      'max-classes',
      '--scale',
      '4',
      '--repeat=2',
      '--keep',
      '--json',
    ]);
    expect(options).toEqual({
      pluginIds: ['js', 'react'],
      ruleFilters: ['max-classes'],
      scale: 4,
      repeat: 2,
      keep: true,
      json: true,
      help: false,
    });
  });
});

describe('bench corpus', () => {
  it('writes eight domains per scale step', () => {
    const files = buildCorpusFiles(2);
    expect(corpusStats(files).files).toBe(16);
    expect(files.some((file) => file.relativePath.startsWith('js/'))).toBe(true);
    expect(files.some((file) => file.relativePath.startsWith('elysia/routes/'))).toBe(true);
  });
});

describe('bench report', () => {
  it('ranks by net time', () => {
    const report = toBenchReport(100, 400, 8, 1000, [
      {
        rule: {
          pluginId: 'js',
          sourcePath: 'src/plugins/js/index.ts',
          metaName: 'bl-js',
          ruleName: 'max-classes',
          ruleId: 'bl-js/max-classes',
        },
        milliseconds: 120,
      },
      {
        rule: {
          pluginId: 'js',
          sourcePath: 'src/plugins/js/index.ts',
          metaName: 'bl-js',
          ruleName: 'no-useless-reexport',
          ruleId: 'bl-js/no-useless-reexport',
        },
        milliseconds: 350,
      },
    ]);
    expect(report.rules[0]?.ruleId).toBe('bl-js/no-useless-reexport');
    expect(report.rules[0]?.netMilliseconds).toBe(250);
  });
});
