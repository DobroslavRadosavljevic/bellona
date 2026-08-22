import { defineConfig } from 'oxlint';

import js from './src/plugins/js/index.ts';

const jsPluginSpecifier = './src/plugins/js/index.ts';

const jsRules = Object.fromEntries(
  Object.keys(js.rules).map((ruleName) => [`${js.meta.name}/${ruleName}`, 'error' as const]),
);

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'node', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  env: { node: true },
  ignorePatterns: ['dist/**', 'coverage/**', '.temp/**', '.agents/**', '.claude/**', 'agent/**'],
  jsPlugins: [jsPluginSpecifier],
  rules: jsRules,
  overrides: [
    {
      files: ['**/*.{test,spec}.ts', 'tests/**'],
      env: { vitest: true },
      plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'node', 'import', 'vitest'],
    },
  ],
});
