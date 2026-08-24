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

export const BELLONA_PLUGIN_NAME = 'bellona';

export function defineBellonaPlugin<const Rules extends { [Key in keyof Rules]: CreateOnceRule }>(
  rules: Rules,
): BellonaPlugin<typeof BELLONA_PLUGIN_NAME, Rules> {
  return {
    meta: { name: BELLONA_PLUGIN_NAME },
    rules,
  };
}
