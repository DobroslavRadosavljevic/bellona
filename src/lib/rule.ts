import type { CreateOnceRule } from '@oxlint/plugins';

export function defineBellonaRule<const Rule extends CreateOnceRule>(rule: Rule): Rule {
  return rule;
}

/** Published rule id slug. Prefix avoids clashing with consumer rule names. */
export function bnRuleName<Slug extends string>(slug: Slug): `bn-${Slug}` {
  return `bn-${slug}`;
}
