import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'node', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  env: { node: true },
  ignorePatterns: ['dist/**', 'coverage/**', '.agents/**', '.claude/**', 'agent/**'],
  overrides: [
    {
      files: ['**/*.{test,spec}.ts', 'tests/**'],
      env: { vitest: true },
      plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'node', 'import', 'vitest'],
    },
  ],
});
