import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    js: './src/plugins/js/index.ts',
    'tanstack-router': './src/plugins/tanstack-router/index.ts',
  },
  format: 'esm',
  dts: true,
  platform: 'node',
  outExtensions: () => ({ js: '.js' }),
});
