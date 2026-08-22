import type { CreateOnceRule } from '@oxlint/plugins';

export interface BellonaPlugin<
  Name extends string,
  Rules extends { [Key in keyof Rules]: CreateOnceRule },
> {
  meta: {
    name: Name;
  };
  rules: Rules;
}

export function defineBellonaPlugin<
  const Name extends string,
  const Rules extends { [Key in keyof Rules]: CreateOnceRule },
>(name: Name, rules: Rules): BellonaPlugin<Name, Rules> {
  return {
    meta: { name },
    rules,
  };
}
