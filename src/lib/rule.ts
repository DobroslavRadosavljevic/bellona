import type { CreateOnceRule } from '@oxlint/plugins';

export function defineVamanaRule<const Rule extends CreateOnceRule>(rule: Rule): Rule {
  return rule;
}

/** Published rule id slug. Prefix avoids clashing with consumer rule names. */
export function vmRuleName<Slug extends string>(slug: Slug): `vm-${Slug}` {
  return `vm-${slug}`;
}
