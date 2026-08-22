import type { CreateOnceRule } from '@oxlint/plugins';

export interface VamanaPlugin<
  Name extends string,
  Rules extends { [Key in keyof Rules]: CreateOnceRule },
> {
  meta: {
    name: Name;
  };
  rules: Rules;
}

export function defineVamanaPlugin<
  const Name extends string,
  const Rules extends { [Key in keyof Rules]: CreateOnceRule },
>(name: Name, rules: Rules): VamanaPlugin<Name, Rules> {
  return {
    meta: { name },
    rules,
  };
}
