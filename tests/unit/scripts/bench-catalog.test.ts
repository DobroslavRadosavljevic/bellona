import { describe, expect, it } from 'vitest';

import {
  filterBenchRules,
  listBenchPlugins,
  listBenchRules,
} from '../../../scripts/bench/catalog.ts';

describe('bench catalog', () => {
  it('lists every Bellona plugin', () => {
    expect(listBenchPlugins().map((plugin) => plugin.id)).toEqual([
      'base-ui',
      'effect',
      'elysia',
      'js',
      'react',
      'tailwind',
      'tanstack-router',
      'zod',
    ]);
  });

  it('lists a rule id for every registered plugin rule', () => {
    const plugins = listBenchPlugins();
    const rules = listBenchRules();
    const expected = plugins.reduce((total, plugin) => total + plugin.ruleNames.length, 0);
    expect(rules).toHaveLength(expected);
    expect(rules.length).toBeGreaterThan(80);
    expect(new Set(rules.map((rule) => rule.ruleId)).size).toBe(rules.length);
  });

  it('filters by plugin id and rule slug', () => {
    const jsRules = listBenchRules(['js']);
    expect(jsRules.every((rule) => rule.pluginId === 'js')).toBe(true);
    const only = filterBenchRules(jsRules, ['max-classes']);
    expect(only.map((rule) => rule.ruleId)).toEqual(['bl-js/max-classes']);
  });
});
