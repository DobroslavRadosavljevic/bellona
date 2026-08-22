import type { Context, CreateOnceRule, Rule, Visitor } from '@oxlint/plugins';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import type { BellonaPlugin } from '../../../src/lib/plugin.ts';

RuleTester.describe = describe;
RuleTester.it = it;

export function createRuleTester(lang: 'js' | 'jsx' | 'ts' | 'tsx' | 'dts' = 'ts'): RuleTester {
  return new RuleTester({
    languageOptions: { parserOptions: { lang } },
  });
}

function withCreate(rule: CreateOnceRule, create: (context: Context) => Visitor): CreateOnceRule {
  if (rule.meta === undefined) {
    return {
      createOnce: (context) => rule.createOnce(context),
      create,
    };
  }
  return {
    meta: rule.meta,
    createOnce: (context) => rule.createOnce(context),
    create,
  };
}

/**
 * `RuleTester` still calls `create`. Published rules only implement `createOnce`.
 */
export function getRule<
  Name extends string,
  Rules extends { [Key in keyof Rules]: CreateOnceRule },
  RuleName extends keyof Rules & string,
>(plugin: BellonaPlugin<Name, Rules>, name: RuleName): Rule {
  const rule = plugin.rules[name];
  if (rule === undefined) {
    throw new Error(`Unknown rule "${name}" on plugin "${plugin.meta.name}"`);
  }
  return withCreate(rule, (context) => {
    const visitorWithHooks = rule.createOnce(context);
    if (visitorWithHooks.before?.() === false) {
      visitorWithHooks.after?.();
      return {};
    }
    return visitorWithHooks;
  });
}

export function runRule<
  Name extends string,
  Rules extends { [Key in keyof Rules]: CreateOnceRule },
  RuleName extends keyof Rules & string,
>(
  plugin: BellonaPlugin<Name, Rules>,
  name: RuleName,
  tests: RuleTester.TestCases,
  lang: 'js' | 'jsx' | 'ts' | 'tsx' | 'dts' = 'ts',
): void {
  createRuleTester(lang).run(name, getRule(plugin, name), tests);
}
