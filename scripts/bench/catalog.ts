import baseUi from '../../src/plugins/base-ui/index.ts';
import effect from '../../src/plugins/effect/index.ts';
import elysia from '../../src/plugins/elysia/index.ts';
import js from '../../src/plugins/js/index.ts';
import react from '../../src/plugins/react/index.ts';
import tailwind from '../../src/plugins/tailwind/index.ts';
import tanstackRouter from '../../src/plugins/tanstack-router/index.ts';
import zod from '../../src/plugins/zod/index.ts';

export type BenchPluginId =
  | 'base-ui'
  | 'effect'
  | 'elysia'
  | 'js'
  | 'react'
  | 'tailwind'
  | 'tanstack-router'
  | 'zod';

export type BenchPlugin = {
  readonly id: BenchPluginId;
  readonly sourcePath: string;
  readonly metaName: string;
  readonly ruleNames: readonly string[];
};

export type BenchRule = {
  readonly pluginId: BenchPluginId;
  readonly sourcePath: string;
  readonly metaName: string;
  readonly ruleName: string;
  readonly ruleId: string;
};

function sortedNames(names: readonly string[]): readonly string[] {
  const copy = names.slice();
  copy.sort();
  return copy;
}

function toBenchPlugin(
  id: BenchPluginId,
  sourcePath: string,
  plugin: { readonly meta: { readonly name: string }; readonly rules: object },
): BenchPlugin {
  return {
    id,
    sourcePath,
    metaName: plugin.meta.name,
    ruleNames: sortedNames(Object.keys(plugin.rules)),
  };
}

const PLUGINS: readonly BenchPlugin[] = [
  toBenchPlugin('base-ui', 'src/plugins/base-ui/index.ts', baseUi),
  toBenchPlugin('effect', 'src/plugins/effect/index.ts', effect),
  toBenchPlugin('elysia', 'src/plugins/elysia/index.ts', elysia),
  toBenchPlugin('js', 'src/plugins/js/index.ts', js),
  toBenchPlugin('react', 'src/plugins/react/index.ts', react),
  toBenchPlugin('tailwind', 'src/plugins/tailwind/index.ts', tailwind),
  toBenchPlugin('tanstack-router', 'src/plugins/tanstack-router/index.ts', tanstackRouter),
  toBenchPlugin('zod', 'src/plugins/zod/index.ts', zod),
];

export function listBenchPlugins(): readonly BenchPlugin[] {
  return PLUGINS;
}

export function listBenchRules(pluginIds: readonly string[] = []): readonly BenchRule[] {
  const allowed = new Set(pluginIds);
  const rules: BenchRule[] = [];
  for (const plugin of PLUGINS) {
    if (allowed.size > 0 && !allowed.has(plugin.id) && !allowed.has(plugin.metaName)) {
      continue;
    }
    for (const ruleName of plugin.ruleNames) {
      rules.push({
        pluginId: plugin.id,
        sourcePath: plugin.sourcePath,
        metaName: plugin.metaName,
        ruleName,
        ruleId: `${plugin.metaName}/${ruleName}`,
      });
    }
  }
  return rules;
}

export function filterBenchRules(
  rules: readonly BenchRule[],
  filters: readonly string[],
): readonly BenchRule[] {
  if (filters.length === 0) {
    return rules;
  }
  return rules.filter((rule) =>
    filters.some(
      (filter) =>
        filter === rule.ruleId ||
        filter === rule.ruleName ||
        filter === `${rule.pluginId}/${rule.ruleName}`,
    ),
  );
}
