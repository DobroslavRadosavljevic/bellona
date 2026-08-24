import type { CreateOnceRule } from '@oxlint/plugins';

export function defineBellonaRule<const Rule extends CreateOnceRule>(rule: Rule): Rule {
  return rule;
}

/** Published rule key. Full Oxlint id is `bl-<plugin>/<slug>`. */
export function bnRuleName<Slug extends string>(slug: Slug): Slug {
  return slug;
}
