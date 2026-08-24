import type { CreateOnceRule } from '@oxlint/plugins';

export function defineBellonaRule<const Rule extends CreateOnceRule>(rule: Rule): Rule {
  return rule;
}

/** Published rule key. Full Oxlint id is `bellona/<plugin>-<slug>`. */
export function bnRuleName<Plugin extends string, Slug extends string>(
  plugin: Plugin,
  slug: Slug,
): `${Plugin}-${Slug}` {
  return `${plugin}-${slug}`;
}
