import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 100,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  sortImports: true,
  ignorePatterns: [
    'dist/**',
    'coverage/**',
    '.temp/**',
    '.agents/**',
    '.claude/**',
    'agent/**',
    'skills/**',
  ],
});
